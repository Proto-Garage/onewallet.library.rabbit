import { Connection, connect } from 'amqplib';
import retry from 'retry';

import logger from './lib/logger';
import Client from './lib/client';
import Worker from './lib/worker';
import Publisher from './lib/publisher';
import Subscriber from './lib/subscriber';
import serialize from './lib/serialize';
import deserialize from './lib/deserialize';
import { ClientOptions, WorkerOptions, SubscriberOptions } from './lib/types';

export { serialize, deserialize };
export * from './lib/types';

interface RabbitOptions {
  uri?: string;
  prefix?: string;
}

export {
  Client, Worker, Publisher, Subscriber,
};

export default class Rabbit {
  private connectionPromise: Promise<Connection>;

  private connection: Connection | null = null;

  private stopping: boolean = false;

  private options: {
    uri: string;
    prefix?: string;
  } = {
    uri: 'amqp://localhost',
  };

  private channels: (Client | Worker | Publisher | Subscriber)[] = [];

  public constructor(options?: RabbitOptions) {
    if (options) {
      this.options = {
        ...this.options,
        ...options,
      };
    }

    const establishConnection = () => new Promise<Connection>((resolve) => {
      const operation = retry.operation({
        forever: true,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 30000,
        randomize: true,
      });

      operation.attempt(async () => {
        logger.info('establishing connection');

        try {
          const connection = await connect(this.options.uri);

          connection.on('close', () => {
            logger.info('disconnected');
            if (!this.stopping) {
              this.connectionPromise = establishConnection();
            }
          });

          connection.on('error', (err) => {
            logger.error(err.message);
          });

          await Promise.all(this.channels.map(channel => channel.start(connection)));

          logger.info('connected');
          this.connection = connection;
          resolve(connection);
        } catch (err) {
          logger.error(err.message);
          operation.retry(err);
        }
      });
    });

    this.connectionPromise = establishConnection();
  }

  public async createClient<TInput extends any[] = any[], TOutput = any>(
    scope: string,
    options?: ClientOptions
  ) {
    const connection = await this.connectionPromise;

    const client = new Client(
      connection,
      `${this.options.prefix || ''}${scope}`,
      options
    );
    await client.start();

    this.channels.push(client);

    const func = (...args: TInput) => client.send<TInput, TOutput>(...args);
    func.client = client;

    return func;
  }

  public async createWorker(
    scope: string,
    handler: (...args: any[]) => Promise<any>,
    options?: WorkerOptions
  ) {
    const connection = await this.connectionPromise;

    const worker = new Worker(
      connection,
      `${this.options.prefix || ''}${scope}`,
      handler,
      options
    );
    await worker.start();

    this.channels.push(worker);

    return worker;
  }

  public async createPublisher(scope: string) {
    const connection = await this.connectionPromise;

    const publisher = new Publisher(
      connection,
      `${this.options.prefix || ''}${scope}`
    );
    await publisher.start();

    this.channels.push(publisher);

    const func = async function publish(topic: string, ...args: any[]) {
      return publisher.send.apply(publisher, [topic, ...args]);
    };
    func.publisher = publisher;

    return func;
  }

  public async createSubscriber(
    scope: string,
    handler: (...args: any[]) => Promise<any>,
    options?: SubscriberOptions
  ) {
    const connection = await this.connectionPromise;

    const subscriber = new Subscriber(
      connection,
      `${this.options.prefix || ''}${scope}`,
      handler,
      options
    );
    await subscriber.start();

    this.channels.push(subscriber);

    return subscriber;
  }

  public async stop() {
    this.stopping = true;
    await Promise.all(this.channels.map(channel => channel.stop()));
    if (this.connection) {
      await this.connection.close();
    }
  }
}
