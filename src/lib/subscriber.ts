import { Connection, Channel } from 'amqplib';
import { v4 as uuid } from 'uuid';
import TaskQueue from 'p-queue';
import AppError from 'onewallet.library.error';

import logger from './logger';
import { SubscriberOptions, PublishMessage } from './types';
import deserialize from './deserialize';

export default class Subscriber {
  private channel: Channel | null = null;

  private taskQueue = new TaskQueue();

  private connection: Connection;

  private options: Required<SubscriberOptions> = {
    topics: [],
    concurrency: 1,
    queue: uuid().replace('-', ''),
    deserialize: true,
  };

  private topics: string[];

  private queue: string;

  public constructor(
    connection: Connection,
    private readonly exchange: string,
    private readonly handler: (...args: any[]) => Promise<any>,
    options?: SubscriberOptions
  ) {
    if (options) {
      this.options = {
        ...this.options,
        ...options,
      };
    }

    this.connection = connection;
    this.queue = `subscriber.${this.options.queue}`;
    this.topics = this.options.topics;
  }

  public async addTopic(topic: string) {
    if (!this.channel) {
      throw new AppError('CHANNEL_NOT_READY', 'Channel is not ready.');
    }

    this.topics.push(topic);
    await this.channel.bindQueue(this.queue, this.exchange, topic);
  }

  public async start(connection?: Connection) {
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
      this.topics.map(async (topic) => {
        if (this.channel) {
          await this.channel.bindQueue(this.queue, this.exchange, topic);
        }
      })
    );

    await this.channel.prefetch(this.options.concurrency);

    const { options } = this;

    await this.channel.consume(
      this.queue,
      async (message) => {
        await this.taskQueue.add(async () => {
          if (!message || !this.channel) {
            return;
          }

          let payload: PublishMessage = JSON.parse(
            message.content.toString()
          );

          if (options.deserialize) {
            payload = {
              ...payload,
              arguments: deserialize(payload.arguments),
            };
          }
          logger.tag('subscriber').verbose(payload);

          try {
            const result = this.handler.apply(this.handler, payload.arguments);

            if (
              !(result === null || result === undefined)
              && typeof result.then === 'function'
            ) {
              await result;
            }
          } catch (err) {
            logger.tag('subscriber').warn(err);
          }

          await this.channel.ack(message);
        });
      },
      { noAck: false }
    );

    logger.tag('subscriber').verbose('started');
  }

  public async stop() {
    await this.taskQueue.onEmpty();
    if (this.channel) {
      await this.channel.close();
    }
  }
}
