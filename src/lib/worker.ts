import { Connection, Channel } from 'amqplib';
import * as R from 'ramda';
import * as TaskQueue from 'p-queue';
import { RequestMessage, WorkerOptions, ResponseMessage } from './types';

export default class Worker {
  private channel: Channel;
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
          if (!message) {
            return;
          }

          const {
            properties: { correlationId },
          } = message;

          const request: RequestMessage = JSON.parse(
            message.content.toString()
          );

          let response: ResponseMessage = { correlationId };
          try {
            let result = this.handler.apply(this.handler, request.arguments);

            if (!R.isNil(result) && typeof result.then === 'function') {
              result = await result;
            }
            response.result = result;
          } catch (err) {
            const error = { message: err.message };
            for (const key in err) {
              error[key] = err[key];
            }
            response.error = error;
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
    await this.channel.close();
  }
}
