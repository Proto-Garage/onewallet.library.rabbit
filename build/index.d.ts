import Worker from './lib/worker';
import Subscriber from './lib/subscriber';
import { ClientOptions, WorkerOptions, SubscriberOptions } from './lib/types';
interface RabbitOptions {
    uri?: string;
    prefix?: string;
}
export default class Rabbit {
    private connecting;
    private connection;
    private stopping;
    private options;
    private channels;
    constructor(options?: RabbitOptions);
    createClient(scope: string, options?: ClientOptions): Promise<(...args: any[]) => Promise<any>>;
    createWorker(scope: string, handler: (...args: Array<any>) => Promise<any>, options?: WorkerOptions): Promise<Worker>;
    createPublisher(scope: string): Promise<(topic: string, ...args: any[]) => Promise<any>>;
    createSubscriber(scope: string, handler: (...args: Array<any>) => Promise<any>, options?: SubscriberOptions): Promise<Subscriber>;
    stop(): Promise<void>;
}
export {};
//# sourceMappingURL=index.d.ts.map