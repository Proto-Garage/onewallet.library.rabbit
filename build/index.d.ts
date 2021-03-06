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
export { Client, Worker, Publisher, Subscriber, };
export default class Rabbit {
    private connectionPromise;
    private connection;
    private stopping;
    private options;
    private channels;
    constructor(options?: RabbitOptions);
    createClient<TInput extends any[] = any[], TOutput = any>(scope: string, options?: ClientOptions): Promise<{
        (...args: TInput): Promise<TOutput | undefined>;
        client: Client;
    }>;
    createWorker(scope: string, handler: (...args: any[]) => Promise<any>, options?: WorkerOptions): Promise<Worker>;
    createPublisher(scope: string): Promise<{
        (topic: string, ...args: any[]): Promise<void>;
        publisher: Publisher;
    }>;
    createSubscriber(scope: string, handler: (...args: any[]) => Promise<any>, options?: SubscriberOptions): Promise<Subscriber>;
    stop(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map