import { Connection } from 'amqplib';
import { WorkerOptions } from './types';
export default class Worker {
    connection: Connection;
    private queue;
    private handler;
    private channel;
    private taskQueue;
    private options;
    constructor(connection: Connection, queue: string, handler: () => Promise<any>, options?: WorkerOptions);
    start(): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=worker.d.ts.map