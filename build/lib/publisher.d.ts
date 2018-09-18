import { Connection, Channel } from 'amqplib';
export default class Publisher {
    connection: Connection;
    private exchange;
    channel: Channel | null;
    constructor(connection: Connection, exchange: string);
    send(topic: string, ...args: Array<any>): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=publisher.d.ts.map