import { Connection, connect } from 'amqplib';
import Client from './lib/client';
import { ClientOptions, WorkerOptions } from './lib/types';
import Worker from './lib/worker';

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
      return client.execute.apply(client, args);
    };
  }
  async createWorker(
    options: WorkerOptions,
    handler: (...args: Array<any>) => Promise<any>
  ) {
    const connection = await this.connecting;

    const worker = new Worker(
      connection,
      {
        ...options,
        queue: {
          ...options.queue,
          name: `${this.options && this.options.prefix}${options.queue.name}`,
        },
      },
      handler
    );
    await worker.start();

    return worker;
  }
  async stop() {}
}
