import { Connection } from 'amqplib';
import { SubscriberOptions } from './types';
export default class Subscriber {
    connection: Connection;
    private exchange;
    private handler;
    private channel;
    private taskQueue;
    private options;
    private queue;
    constructor(connection: Connection, exchange: string, handler: () => Promise<any>, options?: SubscriberOptions);
    start(): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=subscriber.d.ts.map