import { Connection, Channel } from 'amqplib';
import { PublisherOptions } from './types';
export default class Publisher {
    private readonly exchange;
    channel: Channel | null;
    private connection;
    private options;
    constructor(connection: Connection, exchange: string, options?: PublisherOptions);
    send(topic: string, ...args: any[]): Promise<void>;
    start(connection?: Connection): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=publisher.d.ts.map