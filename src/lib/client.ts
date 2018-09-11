import { Connection, Channel } from 'amqplib';
import { v1 as uuid } from 'uuid';
import * as TaskQueue from 'p-queue';
import { RequestMessage, ClientOptions, ResponseMessage } from './types';
import delay from './delay';
import RabbitError from './error';

export default class Client {
  public channel: Channel;
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
      const correlationId = uuid().replace(/-/g, '');

      const payload: RequestMessage = {
        correlationId,
        arguments: args,
        noResponse: this.options.noResponse,
        timestamp: Date.now(),
      };

      await this.channel.sendToQueue(
        this.queue,
        new Buffer(JSON.stringify(payload)),
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

      let callback;
      const promise = new Promise((resolve, reject) => {
        callback = { resolve, reject };
      });
      this.callbacks.set(correlationId, callback);

      return Promise.race([
        promise,
        (async () => {
          await delay(this.options.timeout);
          this.callbacks.delete(correlationId);

          throw new RabbitError('TIMEOUT', 'Request timeout.', {
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
        const callback = this.callbacks.get(correlationId);
        if (callback) {
          if (response.result) {
            callback.resolve(response.result);
          } else {
            callback.reject(
              new RabbitError('WORKER_ERROR', 'Worker error', response.error)
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
    await this.channel.close();
  }
}
