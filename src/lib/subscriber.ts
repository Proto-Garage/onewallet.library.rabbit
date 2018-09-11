import { Connection, Channel } from 'amqplib';
import * as R from 'ramda';
import { v1 as uuid } from 'uuid';
import { SubscriberOptions, PublishMessage } from './types';

export default class Subscriber {
  private channel: Channel;
  private options: {
    topic: string;
    concurrency: number;
  };
  private queue: string;
  constructor(
    public connection: Connection,
    private exchange: string,
    private handler: () => Promise<any>,
    options?: SubscriberOptions
  ) {
    this.options = {
      topic: '*',
      concurrency: 1,
      ...(options || {}),
    };

    this.queue = `subscriber.${uuid().replace('-', '')}`;
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
        if (!message) {
          return;
        }

        const payload: PublishMessage = JSON.parse(message.content.toString());

        try {
          let result = this.handler.apply(this.handler, payload.arguments);

          if (!R.isNil(result) && typeof result.then === 'function') {
            result = await result;
          }
        } catch (err) {}

        await this.channel.ack(message);
      },
      { noAck: false }
    );
  }
  async stop() {}
}
