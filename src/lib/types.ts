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
    message: string;
    [key: string]: any;
  };
}

export interface ClientOptions {
  timeout?: number;
  noResponse?: boolean;
}

export interface QueueOptions {
  name: string;
  messageTtl?: number;
  maxLength?: number;
}

export interface WorkerOptions {
  queue: QueueOptions;
  concurrency?: number;
}
