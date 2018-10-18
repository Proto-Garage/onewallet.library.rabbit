import { Connection, Channel } from 'amqplib';
import { v1 as uuid } from 'uuid';
import TaskQueue from 'p-queue';
import AppError from 'onewallet.library.error';
import R from 'ramda';

import logger from './logger';
import { RequestMessage, ClientOptions, ResponseMessage } from './types';
import delay from './delay';

export default class Client {
  public channel: Channel | null = null;
  private callback: string;
  private callbacks: Map<string, { resolve: Function; reject: Function }>;
  private taskQueue: TaskQueue;
  private options: {
    timeout: number;
    noResponse: boolean;
  } = {
    timeout: 60000,
    noResponse: false,
  };
  constructor(
    public connection: Connection,
    private queue: string,
    options?: ClientOptions
  ) {
    if (options) {
      this.options = {
        ...this.options,
        ...options,
      };
    }

    this.callback = `callback.${uuid().replace('-', '')}`;
    this.callbacks = new Map();

    this.taskQueue = new TaskQueue();
  }

  async send(...args: Array<any>) {
    return this.taskQueue.add(async () => {
      if (!this.channel) {
        throw new AppError('CHANNEL_NOT_READY', 'Channel not started.');
      }

      const correlationId = uuid().replace(/-/g, '');

      const request: RequestMessage = {
        correlationId,
        arguments: args,
        noResponse: this.options.noResponse,
        timestamp: Date.now(),
      };

      logger
        .tag('client')
        .tag('request')
        .verbose(request);

      await this.channel.sendToQueue(
        this.queue,
        new Buffer(JSON.stringify(request)),
        {
          correlationId,
          replyTo: this.callback,
          persistent: true,
          expiration: this.options.timeout,
        }
      );

      if (this.options.noResponse) {
        return;
      }

      const promise = new Promise((resolve, reject) => {
        this.callbacks.set(correlationId, { resolve, reject });
      });

      return Promise.race([
        promise,
        (async () => {
          await delay(this.options.timeout);
          this.callbacks.delete(correlationId);

          throw new AppError('TIMEOUT', 'Request timeout.', {
            queue: this.queue,
            arguments: args,
          });
        })(),
      ]);
    });
  }

  async start() {
    this.channel = await this.connection.createChannel();

    if (this.options.noResponse) {
      return;
    }

    await this.channel.assertQueue(this.callback, {
      messageTtl: this.options.timeout,
      expires: 600000,
      durable: true,
    });

    await this.channel.consume(
      this.callback,
      async message => {
        if (!message) {
          return;
        }

        const {
          properties: { correlationId },
        } = message;

        const response: ResponseMessage = JSON.parse(
          message.content.toString()
        );

        logger
          .tag('client')
          .tag('response')
          .verbose(response);

        const callback = this.callbacks.get(correlationId);
        if (callback) {
          if (response.result) {
            callback.resolve(response.result);
          } else if (response.error) {
            const { error } = response;
            callback.reject(
              new AppError(
                error.code,
                error.message,
                R.omit(['code', 'message'])(error)
              )
            );
          }
          this.callbacks.delete(correlationId);
        }
      },
      { noAck: true }
    );
  }

  async stop() {
    await this.taskQueue.onEmpty();
    if (this.channel) {
      await this.channel.close();
    }
  }
}
