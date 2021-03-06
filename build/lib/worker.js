"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const p_queue_1 = __importDefault(require("p-queue"));
const serialize_error_1 = __importDefault(require("serialize-error"));
const logger_1 = __importDefault(require("./logger"));
const deserialize_1 = __importDefault(require("./deserialize"));
const serialize_1 = __importDefault(require("./serialize"));
class Worker {
    constructor(connection, queue, handler, options) {
        this.queue = queue;
        this.handler = handler;
        this.channel = null;
        this.taskQueue = new p_queue_1.default();
        this.options = {
            concurrency: 1,
            serialize: true,
            deserialize: true,
        };
        if (options) {
            this.options = Object.assign({}, this.options, options);
        }
        this.connection = connection;
    }
    async start(connection) {
        logger_1.default.tag('worker').verbose('starting');
        if (connection) {
            this.connection = connection;
        }
        this.channel = await this.connection.createChannel();
        await this.channel.assertQueue(this.queue, {
            exclusive: false,
            durable: true,
            autoDelete: false,
        });
        await this.channel.prefetch(this.options.concurrency);
        const { options } = this;
        await this.channel.consume(this.queue, async (message) => {
            await this.taskQueue.add(async () => {
                if (!message || !this.channel) {
                    return;
                }
                const { properties: { correlationId }, } = message;
                let request = JSON.parse(message.content.toString());
                if (options.deserialize) {
                    request = Object.assign({}, request, { arguments: deserialize_1.default(request.arguments) });
                }
                logger_1.default
                    .tag('worker')
                    .tag('request')
                    .verbose({ queue: this.queue, request });
                const response = { correlationId };
                try {
                    let result = this.handler.apply(this.handler, request.arguments);
                    if (!(result === null || result === undefined)
                        && typeof result.then === 'function') {
                        result = await result;
                    }
                    if (options.serialize) {
                        result = serialize_1.default(result);
                    }
                    response.result = result;
                }
                catch (err) {
                    logger_1.default.tag('worker').error(err);
                    if (err.name === 'AppError') {
                        response.error = err.toJSON();
                    }
                    else {
                        response.error = serialize_error_1.default(err);
                    }
                }
                await this.channel.ack(message);
                if (request.noResponse) {
                    return;
                }
                await this.channel.sendToQueue(message.properties.replyTo, Buffer.from(JSON.stringify(response)), { correlationId, persistent: true });
            });
        }, { noAck: false });
        logger_1.default.tag('worker').verbose('started');
    }
    async stop() {
        await this.taskQueue.onEmpty();
        if (this.channel) {
            await this.channel.close();
        }
    }
}
exports.default = Worker;
//# sourceMappingURL=worker.js.map