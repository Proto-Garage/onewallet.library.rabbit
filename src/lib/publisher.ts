import { Connection, Channel } from 'amqplib';
import AppError from 'onewallet.library.error';

import logger from './logger';
import { PublishMessage } from './types';

export default class Publisher {
  public channel: Channel | null = null;

  private connection: Connection;

  public constructor(connection: Connection, private readonly exchange: string) {
    this.connection = connection;
  }

  public async send(topic: string, ...args: any[]) {
    if (!this.channel) {
      throw new AppError('CHANNEL_NOT_READY', 'Channel not started.');
    }
    const payload: PublishMessage = {
      arguments: args,
      timestamp: Date.now(),
    };
    logger.tag('publisher').verbose(payload);

    await this.channel.publish(
      this.exchange,
      topic,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true }
    );
  }

  public async start(connection?: Connection) {
    logger.tag('publisher').verbose('starting');

    if (connection) {
      this.connection = connection;
    }

    this.channel = await this.connection.createChannel();

    await this.channel.assertExchange(this.exchange, 'topic', {
      durable: true,
    });

    logger.tag('publisher').verbose('started');
  }

  public async stop() {
    if (this.channel) {
      await this.channel.close();
    }
  }
}
