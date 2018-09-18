import { Connection, Channel } from 'amqplib';
import { v1 as uuid } from 'uuid';
import TaskQueue from 'p-queue';
import logger from './logger';
import { SubscriberOptions, PublishMessage } from './types';

export default class Subscriber {
  private channel: Channel | null = null;
  private taskQueue: TaskQueue;
  private options: {
    topic: string;
    concurrency: number;
  } = {
    topic: '*',
    concurrency: 1,
  };
  private queue: string;
  constructor(
    public connection: Connection,
    private exchange: string,
    private handler: () => Promise<any>,
    options?: SubscriberOptions
  ) {
    if (options) {
      this.options = {
        ...this.options,
        ...options,
      };
    }

    this.queue = `subscriber.${uuid().replace('-', '')}`;
    this.taskQueue = new TaskQueue();
  }
  async start() {
    this.channel = await this.connection.createChannel();

    await this.channel.assertQueue(this.queue, {
      exclusive: false,
      durable: true,
      expires: 600000,
    });
    await this.channel.assertExchange(this.exchange, 'topic', {
      durable: true,
    });
    await this.channel.bindQueue(this.queue, this.exchange, this.options.topic);
    await this.channel.prefetch(this.options.concurrency);

    await this.channel.consume(
      this.queue,
      async message => {
        await this.taskQueue.add(async () => {
          if (!message || !this.channel) {
            return;
          }

          const payload: PublishMessage = JSON.parse(
            message.content.toString()
          );
          logger.tag('subscriber').verbose(payload);

          try {
            let result = this.handler.apply(this.handler, payload.arguments);

            if (
              !(result === null || result === undefined) &&
              typeof result.then === 'function'
            ) {
              result = await result;
            }
          } catch (err) {}

          await this.channel.ack(message);
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
