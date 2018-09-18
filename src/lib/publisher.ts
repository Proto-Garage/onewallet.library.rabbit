import { Connection, Channel } from 'amqplib';
import logger from './logger';
import { PublishMessage } from './types';
import RabbitError from './error';

export default class Publisher {
  public channel: Channel | null = null;
  constructor(public connection: Connection, private exchange: string) {}

  async send(topic: string, ...args: Array<any>) {
    if (!this.channel) {
      throw new RabbitError('CHANNEL_NOT_READY', 'Channel not started.');
    }
    const payload: PublishMessage = {
      arguments: args,
      timestamp: Date.now(),
    };
    logger.tag('publisher').verbose(payload);

    await this.channel.publish(
      this.exchange,
      topic,
      new Buffer(JSON.stringify(payload)),
      { persistent: true }
    );
  }

  async start() {
    this.channel = await this.connection.createChannel();

    await this.channel.assertExchange(this.exchange, 'topic', {
      durable: true,
    });
  }

  async stop() {
    if (this.channel) {
      await this.channel.close();
    }
  }
}
