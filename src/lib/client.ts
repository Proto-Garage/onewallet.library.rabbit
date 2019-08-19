import { Connection, Channel } from 'amqplib';
import { v1 as uuid } from 'uuid';
import TaskQueue from 'p-queue';
import AppError from 'onewallet.library.error';
import R from 'ramda';

import logger from './logger';
import { RequestMessage, ClientOptions, ResponseMessage } from './types';
import delay from './delay';
import serialize from './serialize';
import deserialize from './deserialize';

export default class Client {
  public channel: Channel | null = null;

  private readonly callback = `callback.${uuid().replace('-', '')}`

  private readonly callbacks = new Map<string, { resolve: Function; reject: Function }>();

  private readonly taskQueue = new TaskQueue();

  private connection: Connection;

  private options: Required<ClientOptions> = {
    timeout: 60000,
    noResponse: false,
    deserialize: true,
    serialize: true,
  };

  public constructor(
    connection: Connection,
    private readonly queue: string,
    options?: ClientOptions
  ) {
    if (options) {
      this.options = {
        ...this.options,
        ...options,
      };
    }

    this.connection = connection;
  }

  public async send<TInput extends any[], TOutput>(
    ...args: TInput
  ): Promise<TOutput | undefined> {
    return this.taskQueue.add(async () => {
      if (!this.channel) {
        throw new AppError('CHANNEL_NOT_READY', 'Channel not started.');
      }

      const correlationId = uuid().replace(/-/g, '');

      const request: RequestMessage = {
        correlationId,
        arguments: this.options.serialize ? serialize(args) : args,
        noResponse: this.options.noResponse,
        timestamp: Date.now(),
      };

      logger
        .tag('client')
        .tag('request')
        .verbose({ queue: this.queue, request });

      await this.channel.sendToQueue(
        this.queue,
        Buffer.from(JSON.stringify(request)),
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

      const promise = new Promise<TOutput>((resolve, reject) => {
        this.callbacks.set(correlationId, { resolve, reject });
      });

      // eslint-disable-next-line consistent-return
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

  public async start(connection?: Connection) {
    logger.tag('client').verbose('starting');

    if (connection) {
      this.connection = connection;
    }

    this.channel = await this.connection.createChannel();

    if (this.options.noResponse) {
      return;
    }

    await this.channel.assertQueue(this.callback, {
      messageTtl: this.options.timeout,
      expires: 600000,
      durable: true,
    });

    const { options } = this;

    await this.channel.consume(
      this.callback,
      async (message) => {
        if (!message) {
          return;
        }

        const {
          properties: { correlationId },
        } = message;

        let response: ResponseMessage = JSON.parse(
          message.content.toString()
        );

        if (!R.isNil(response.result) && options.deserialize) {
          response = {
            ...response,
            result: deserialize(response.result),
          };
        }

        logger
          .tag('client')
          .tag('response')
          .verbose({ response });

        const { error } = response;

        const callback = this.callbacks.get(correlationId);
        if (callback) {
          if (error) {
            if (error.name === 'AppError') {
              callback.reject(
                new AppError(
                  error.code,
                  error.message,
                  {
                    ...R.omit(['id', 'name', 'code', 'message', 'stack', 'service'])(error),
                    original: error,
                  },
                  error.service
                )
              );
            } else {
              callback.reject(
                new AppError(
                  'SERVER_ERROR',
                  error.message,
                  { original: error }
                )
              );
            }
          } else {
            callback.resolve(response.result);
          }

          this.callbacks.delete(correlationId);
        }
      },
      { noAck: true }
    );

    logger.tag('client').verbose('started');
  }

  public async stop() {
    await this.taskQueue.onEmpty();
    if (this.channel) {
      await this.channel.close();
    }
  }
}
