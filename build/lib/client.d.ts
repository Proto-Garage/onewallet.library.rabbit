import { Connection, Channel } from 'amqplib';
import { ClientOptions } from './types';
export default class Client {
    connection: Connection;
    private queue;
    channel: Channel | null;
    private callback;
    private callbacks;
    private taskQueue;
    private options;
    constructor(connection: Connection, queue: string, options?: ClientOptions);
    send(...args: Array<any>): Promise<{} | undefined>;
    start(): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=client.d.ts.map