import { Connection } from 'amqplib';
import { WorkerOptions } from './types';
export default class Worker {
    private readonly queue;
    private readonly handler;
    private channel;
    private taskQueue;
    private options;
    private connection;
    constructor(connection: Connection, queue: string, handler: (...args: any[]) => Promise<any>, options?: WorkerOptions);
    start(connection?: Connection): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=worker.d.ts.map