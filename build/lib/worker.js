"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const p_queue_1 = __importDefault(require("p-queue"));
const logger_1 = __importDefault(require("./logger"));
class Worker {
    constructor(connection, queue, handler, options) {
        this.queue = queue;
        this.handler = handler;
        this.channel = null;
        this.taskQueue = new p_queue_1.default();
        this.options = {
            concurrency: 1,
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
        await this.channel.consume(this.queue, async (message) => {
            await this.taskQueue.add(async () => {
                if (!message || !this.channel) {
                    return;
                }
                const { properties: { correlationId }, } = message;
                const request = JSON.parse(message.content.toString());
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
                    response.result = result;
                }
                catch (err) {
                    logger_1.default.tag('worker').error(err);
                    if (err.name === 'AppError') {
                        response.error = err.toJSON();
                    }
                    else {
                        response.error = {
                            code: 'SERVER_ERROR',
                            message: 'Internal server error',
                        };
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