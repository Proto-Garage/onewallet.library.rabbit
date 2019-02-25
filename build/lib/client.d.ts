import { Connection, Channel } from 'amqplib';
import { ClientOptions } from './types';
export default class Client {
    private connection;
    private queue;
    channel: Channel | null;
    private callback;
    private callbacks;
    private taskQueue;
    private options;
    constructor(connection: Connection, queue: string, options?: ClientOptions);
    send<TInput extends any[], TOutput>(...args: TInput): Promise<TOutput | undefined>;
    start(connection?: Connection): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=client.d.ts.map