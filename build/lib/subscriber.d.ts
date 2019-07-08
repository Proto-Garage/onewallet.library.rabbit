import { Connection } from 'amqplib';
import { SubscriberOptions } from './types';
export default class Subscriber {
    private readonly exchange;
    private readonly handler;
    private channel;
    private taskQueue;
    private connection;
    private options;
    private topics;
    private queue;
    constructor(connection: Connection, exchange: string, handler: (...args: any[]) => Promise<any>, options?: SubscriberOptions);
    addTopic(topic: string): Promise<void>;
    start(connection?: Connection): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=subscriber.d.ts.map