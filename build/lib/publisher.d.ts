import { Connection, Channel } from 'amqplib';
export default class Publisher {
    private readonly exchange;
    channel: Channel | null;
    private connection;
    constructor(connection: Connection, exchange: string);
    send(topic: string, ...args: any[]): Promise<void>;
    start(connection?: Connection): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=publisher.d.ts.map