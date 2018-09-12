import { Connection, connect } from 'amqplib';
import * as retry from 'retry';
import * as debug from 'debug';
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
  private connection: Connection;
  private stopping: boolean = false;
  private options: {
    uri: string;
    prefix: string;
  } = {
    uri: 'amqp://localhost',
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
      this.establishConnection();
    }
  }
  private async establishConnection() {
    this.connecting = new Promise(resolve => {
      const operation = retry.operation({
        forever: true,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 10000,
        randomize: true,
      });
      operation.attempt(() => {
        connect(this.options.uri)
          .then(connection => {
            connection.on('close', () => {
              debug('rabbit:info')('disconnected');
              if (!this.stopping) {
                this.establishConnection();
              }
            });
            connection.on('error', err => {
              debug('rabbit:error')(err.message);
            });

            for (const channel of this.channels) {
              channel.connection = connection;
              channel.start();
            }

            debug('rabbit:info')('connected');
            resolve(connection);
          })
          .catch(err => {
            debug('rabbit:error')(err.message);
            operation.retry(err);
          });
      });
    });
  }
  async createClient(scope: string, options?: ClientOptions) {
    const connection = await this.connecting;

    const client = new Client(
      connection,
      `${this.options.prefix}${scope}`,
      options
    );
    await client.start();

    this.channels.push(client);

    return async function(...args: Array<any>) {
      return client.send.apply(client, args);
    };
  }
  async createWorker(
    scope: string,
    handler: (...args: Array<any>) => Promise<any>,
    options?: WorkerOptions
  ) {
    const connection = await this.connecting;

    const worker = new Worker(
      connection,
      `${this.options.prefix}${scope}`,
      handler,
      options
    );
    await worker.start();

    this.channels.push(worker);

    return worker;
  }
  async createPublisher(scope: string) {
    const connection = await this.connecting;

    const publisher = new Publisher(
      connection,
      `${this.options.prefix}${scope}`
    );
    await publisher.start();

    this.channels.push(publisher);

    return async function(topic: string, ...args: Array<any>) {
      return publisher.send.apply(publisher, [topic, ...args]);
    };
  }
  async createSubscriber(
    scope: string,
    handler: (...args: Array<any>) => Promise<any>,
    options?: SubscriberOptions
  ) {
    const connection = await this.connecting;

    const subscriber = new Subscriber(
      connection,
      `${this.options.prefix}${scope}`,
      handler,
      options
    );
    await subscriber.start();

    this.channels.push(subscriber);

    return subscriber;
  }
  async stop() {
    this.stopping = true;
    await Promise.all(this.channels.map(channel => channel.stop()));
    if (this.connection) {
      await this.connection.close();
    }
  }
}
