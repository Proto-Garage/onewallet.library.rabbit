import { Connection, connect } from 'amqplib';
import Client from './lib/client';
import Worker from './lib/worker';
import Publisher from './lib/publisher';
import Subscriber from './lib/subscriber';
import { ClientOptions, WorkerOptions, SubscriberOptions } from './lib/types';

interface RabbitOptions {
  uri?: string;
  prefix?: string;
}

export default class Rabbit {
  private connecting: Promise<Connection>;
  private options: {
    uri: string;
    prefix: string;
  };
  constructor(options?: RabbitOptions) {
    this.options = {
      uri: 'amqp://127.0.0.1',
      prefix: '',
      ...(options || {}),
    };

    if (options) {
      Object.assign(this.options, options);
    }

    if (this.options.uri) {
      this.connecting = Promise.resolve(connect(this.options.uri));
    }
  }
  async createClient(queue: string, options?: ClientOptions) {
    const connection = await this.connecting;

    const client = new Client(
      connection,
      `${this.options.prefix}${queue}`,
      options
    );
    await client.start();

    return async function(...args: Array<any>) {
      return client.send.apply(client, args);
    };
  }
  async createWorker(
    queue: string,
    handler: (...args: Array<any>) => Promise<any>,
    options?: WorkerOptions
  ) {
    const connection = await this.connecting;

    const worker = new Worker(
      connection,
      `${this.options.prefix}${queue}`,
      handler,
      options
    );
    await worker.start();

    return worker;
  }
  async createPublisher(exchange: string) {
    const connection = await this.connecting;

    const publisher = new Publisher(
      connection,
      `${this.options.prefix}${exchange}`
    );
    await publisher.start();

    return async function(topic: string, ...args: Array<any>) {
      return publisher.send.apply(publisher, [topic, ...args]);
    };
  }
  async createSubscriber(
    exchange: string,
    handler: (...args: Array<any>) => Promise<any>,
    options?: SubscriberOptions
  ) {
    const connection = await this.connecting;

    const subscriber = new Subscriber(
      connection,
      `${this.options.prefix}${exchange}`,
      handler,
      options
    );
    await subscriber.start();

    return subscriber;
  }
  async stop() {}
}
