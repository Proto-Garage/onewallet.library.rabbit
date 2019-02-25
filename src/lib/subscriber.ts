import { Connection, Channel } from 'amqplib';
import { v4 as uuid } from 'uuid';
import TaskQueue from 'p-queue';
import AppError from 'onewallet.library.error';

import logger from './logger';
import { SubscriberOptions, PublishMessage } from './types';

export default class Subscriber {
  private channel: Channel | null = null;
  private taskQueue: TaskQueue;
  private options: {
    topics: string[];
    queue?: string;
    concurrency: number;
  } = {
    topics: [],
    concurrency: 1,
  };
  private topics: string[];
  private queue: string;
  constructor(
    public connection: Connection,
    private exchange: string,
    private handler: (...args: any[]) => Promise<any>,
    options?: SubscriberOptions
  ) {
    if (options) {
      this.options = {
        ...this.options,
        ...options,
      };
    }

    this.queue = `subscriber.${this.options.queue || uuid().replace('-', '')}`;
    this.topics = this.options.topics;
    this.taskQueue = new TaskQueue();
  }
  async addTopic(topic: string) {
    if (!this.channel) {
      throw new AppError('CHANNEL_NOT_READY', 'Channel is not ready.');
    }

    this.topics.push(topic);
    await this.channel.bindQueue(this.queue, this.exchange, topic);
  }
  async start(connection?: Connection) {
    logger.tag('subscriber').verbose('starting');

    if (connection) {
      this.connection = connection;
    }

    this.channel = await this.connection.createChannel();

    await this.channel.assertQueue(this.queue, {
      exclusive: false,
      durable: true,
      expires: 600000,
    });
    await this.channel.assertExchange(this.exchange, 'topic', {
      durable: true,
    });

    await Promise.all(
      this.topics.map(async topic => {
        if (this.channel) {
          await this.channel.bindQueue(this.queue, this.exchange, topic);
        }
      })
    );

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

    logger.tag('subscriber').verbose('started');
  }
  async stop() {
    await this.taskQueue.onEmpty();
    if (this.channel) {
      await this.channel.close();
    }
  }
}
