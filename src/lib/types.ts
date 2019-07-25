export interface RequestMessage {
  correlationId: string;
  arguments: any[];
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
  arguments: any[];
  timestamp: number;
}

export interface ClientOptions {
  timeout?: number;
  noResponse?: boolean;
  serialize?: boolean;
  deserialize?: boolean;
}

export interface WorkerOptions {
  concurrency?: number;
  serialize?: boolean;
  deserialize?: boolean;
}

export interface PublisherOptions {
  serialize?: boolean;
}

export interface SubscriberOptions {
  topics: string[];
  queue?: string;
  concurrency?: number;
  deserialize?: boolean;
}
