import { Connection, Channel } from 'amqplib';
import TaskQueue from 'p-queue';

import logger from './logger';
import { RequestMessage, WorkerOptions, ResponseMessage } from './types';

export default class Worker {
  private channel: Channel | null = null;
  private taskQueue: TaskQueue;
  private options: {
    concurrency: number;
  } = {
    concurrency: 1,
  };
  constructor(
    public connection: Connection,
    private queue: string,
    private handler: () => Promise<any>,
    options?: WorkerOptions
  ) {
    if (options) {
      this.options = {
        ...this.options,
        ...options,
      };
    }

    this.taskQueue = new TaskQueue();
  }
  async start() {
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(this.queue, {
      exclusive: false,
      durable: true,
      autoDelete: false,
    });
    await this.channel.prefetch(this.options.concurrency);

    await this.channel.consume(
      this.queue,
      async message => {
        await this.taskQueue.add(async () => {
          if (!message || !this.channel) {
            return;
          }

          const {
            properties: { correlationId },
          } = message;

          const request: RequestMessage = JSON.parse(
            message.content.toString()
          );

          logger
            .tag('worker')
            .tag('request')
            .verbose(request);

          let response: ResponseMessage = { correlationId };
          try {
            let result = this.handler.apply(this.handler, request.arguments);

            if (
              !(result === null || result === undefined) &&
              typeof result.then === 'function'
            ) {
              result = await result;
            }

            response.result = result;
          } catch (err) {
            if (err.name === 'AppError') {
              const error: { message: string; [key: string]: any } = {
                message: err.message as string,
              };
              for (const key in err) {
                error[key] = err[key];
              }
              response.error = error;
            } else {
              logger.tag('worker').error(err);

              response.error = {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error',
              };
            }
          }

          await this.channel.ack(message);

          if (request.noResponse) {
            return;
          }

          await this.channel.sendToQueue(
            message.properties.replyTo,
            new Buffer(JSON.stringify(response)),
            { correlationId, persistent: true }
          );
        });
      },
      { noAck: false }
    );
  }
  async stop() {
    await this.taskQueue.onEmpty();
    if (this.channel) {
      await this.channel.close();
    }
  }
}
