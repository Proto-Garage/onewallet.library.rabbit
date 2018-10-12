export interface RequestMessage {
    correlationId: string;
    arguments: Array<any>;
    noResponse: boolean;
    timestamp: number;
}
export interface ResponseMessage {
    correlationId: string;
    result?: any;
    error?: {
        code: string;
        message: string;
        meta?: {
            [key: string]: any;
        };
    };
}
export interface PublishMessage {
    arguments: Array<any>;
    timestamp: number;
}
export interface ClientOptions {
    timeout?: number;
    noResponse?: boolean;
}
export interface WorkerOptions {
    concurrency?: number;
}
export interface SubscriberOptions {
    topics: string[];
    queue?: string;
    concurrency?: number;
}
//# sourceMappingURL=types.d.ts.map