import { Connection, Channel } from 'amqplib';
import TaskQueue from 'p-queue';
import serializeError from 'serialize-error';

import logger from './logger';
import { RequestMessage, WorkerOptions, ResponseMessage } from './types';
import deserialize from './deserialize';
import serialize from './serialize';

export default class Worker {
  private channel: Channel | null = null;

  private taskQueue = new TaskQueue();

  private options: Required<WorkerOptions> = {
    concurrency: 1,
    serialize: true,
    deserialize: true,
  };

  private connection: Connection;

  public constructor(
    connection: Connection,
    private readonly queue: string,
    private readonly handler: (...args: any[]) => Promise<any>,
    options?: WorkerOptions
  ) {
    if (options) {
      this.options = {
        ...this.options,
        ...options,
      };
    }

    this.connection = connection;
  }

  public async start(connection?: Connection) {
    logger.tag('worker').verbose('starting');

    if (connection) {
      this.connection = connection;
    }

    this.channel = await this.connection.createChannel();

    await this.channel.assertQueue(this.queue, {
      exclusive: false,
      durable: true,
      autoDelete: false,
    });
    await this.channel.prefetch(this.options.concurrency);

    const { options } = this;

    await this.channel.consume(
      this.queue,
      async (message) => {
        await this.taskQueue.add(async () => {
          if (!message || !this.channel) {
            return;
          }

          const {
            properties: { correlationId },
          } = message;

          let request: RequestMessage = JSON.parse(
            message.content.toString()
          );

          if (options.deserialize) {
            request = {
              ...request,
              arguments: deserialize(request.arguments),
            };
          }

          logger
            .tag('worker')
            .tag('request')
            .verbose({ queue: this.queue, request });

          const response: ResponseMessage = { correlationId };
          try {
            let result = this.handler.apply(this.handler, request.arguments);

            if (
              !(result === null || result === undefined)
              && typeof result.then === 'function'
            ) {
              result = await result;
            }

            if (options.serialize) {
              result = serialize(result);
            }

            response.result = result;
          } catch (err) {
            logger.tag('worker').error(err);

            if (err.name === 'AppError') {
              response.error = err.toJSON();
            } else {
              response.error = serializeError(err);
            }
          }

          await this.channel.ack(message);

          if (request.noResponse) {
            return;
          }

          await this.channel.sendToQueue(
            message.properties.replyTo,
            Buffer.from(JSON.stringify(response)),
            { correlationId, persistent: true }
          );
        });
      },
      { noAck: false }
    );

    logger.tag('worker').verbose('started');
  }

  public async stop() {
    await this.taskQueue.onEmpty();
    if (this.channel) {
      await this.channel.close();
    }
  }
}
