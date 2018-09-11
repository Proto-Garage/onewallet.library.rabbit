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
  } = {
    uri: 'amqp://127.0.0.1',
    prefix: '',
  };
  private channels: Array<Client | Worker | Publisher | Subscriber> = [];
  constructor(options?: RabbitOptions) {
    if (options) {
      this.options = {
        ...this.options,
        ...options,
      };
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

    this.channels.push(client);

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

    this.channels.push(worker);

    return worker;
  }
  async createPublisher(exchange: string) {
    const connection = await this.connecting;

    const publisher = new Publisher(
      connection,
      `${this.options.prefix}${exchange}`
    );
    await publisher.start();

    this.channels.push(publisher);

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

    this.channels.push(subscriber);

    return subscriber;
  }
  async stop() {
    await Promise.all(this.channels.map(channel => channel.stop()));
  }
}
