"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const p_queue_1 = __importDefault(require("p-queue"));
const onewallet_library_error_1 = __importDefault(require("onewallet.library.error"));
const logger_1 = __importDefault(require("./logger"));
class Subscriber {
    constructor(connection, exchange, handler, options) {
        this.exchange = exchange;
        this.handler = handler;
        this.channel = null;
        this.taskQueue = new p_queue_1.default();
        this.options = {
            topics: [],
            concurrency: 1,
        };
        if (options) {
            this.options = Object.assign({}, this.options, options);
        }
        this.connection = connection;
        this.queue = `subscriber.${this.options.queue || uuid_1.v4().replace('-', '')}`;
        this.topics = this.options.topics;
    }
    async addTopic(topic) {
        if (!this.channel) {
            throw new onewallet_library_error_1.default('CHANNEL_NOT_READY', 'Channel is not ready.');
        }
        this.topics.push(topic);
        await this.channel.bindQueue(this.queue, this.exchange, topic);
    }
    async start(connection) {
        logger_1.default.tag('subscriber').verbose('starting');
        if (connection) {
            this.connection = connection;
        }
        this.channel = await this.connection.createChannel();
        await this.channel.assertQueue(this.queue, {
            exclusive: false,
            durable: true,
            expires: 600000,
        });
        await this.channel.assertExchange(this.exchange, 'topic', {
            durable: true,
        });
        await Promise.all(this.topics.map(async (topic) => {
            if (this.channel) {
                await this.channel.bindQueue(this.queue, this.exchange, topic);
            }
        }));
        await this.channel.prefetch(this.options.concurrency);
        await this.channel.consume(this.queue, async (message) => {
            await this.taskQueue.add(async () => {
                if (!message || !this.channel) {
                    return;
                }
                const payload = JSON.parse(message.content.toString());
                logger_1.default.tag('subscriber').verbose(payload);
                try {
                    let result = this.handler.apply(this.handler, payload.arguments);
                    if (!(result === null || result === undefined)
                        && typeof result.then === 'function') {
                        result = await result;
                    }
                }
                catch (err) {
                    logger_1.default.tag('subscriber').warn(err);
                }
                await this.channel.ack(message);
            });
        }, { noAck: false });
        logger_1.default.tag('subscriber').verbose('started');
    }
    async stop() {
        await this.taskQueue.onEmpty();
        if (this.channel) {
            await this.channel.close();
        }
    }
}
exports.default = Subscriber;
//# sourceMappingURL=subscriber.js.map