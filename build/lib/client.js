"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const p_queue_1 = __importDefault(require("p-queue"));
const onewallet_library_error_1 = __importDefault(require("onewallet.library.error"));
const ramda_1 = __importDefault(require("ramda"));
const logger_1 = __importDefault(require("./logger"));
const delay_1 = __importDefault(require("./delay"));
const serialize_1 = __importDefault(require("./serialize"));
const deserialize_1 = __importDefault(require("./deserialize"));
class Client {
    constructor(connection, queue, options) {
        this.queue = queue;
        this.channel = null;
        this.callback = `callback.${uuid_1.v1().replace('-', '')}`;
        this.callbacks = new Map();
        this.taskQueue = new p_queue_1.default();
        this.options = {
            timeout: 60000,
            noResponse: false,
            deserialize: true,
            serialize: true,
        };
        if (options) {
            this.options = Object.assign({}, this.options, options);
        }
        this.connection = connection;
    }
    async send(...args) {
        return this.taskQueue.add(async () => {
            if (!this.channel) {
                throw new onewallet_library_error_1.default('CHANNEL_NOT_READY', 'Channel not started.');
            }
            const correlationId = uuid_1.v1().replace(/-/g, '');
            const request = {
                correlationId,
                arguments: this.options.serialize ? serialize_1.default(args) : args,
                noResponse: this.options.noResponse,
                timestamp: Date.now(),
            };
            logger_1.default
                .tag('client')
                .tag('request')
                .verbose({ queue: this.queue, request });
            await this.channel.sendToQueue(this.queue, Buffer.from(JSON.stringify(request)), {
                correlationId,
                replyTo: this.callback,
                persistent: true,
                expiration: this.options.timeout,
            });
            if (this.options.noResponse) {
                return;
            }
            const promise = new Promise((resolve, reject) => {
                this.callbacks.set(correlationId, { resolve, reject });
            });
            return Promise.race([
                promise,
                (async () => {
                    await delay_1.default(this.options.timeout);
                    this.callbacks.delete(correlationId);
                    throw new onewallet_library_error_1.default('TIMEOUT', 'Request timeout.', {
                        queue: this.queue,
                        arguments: args,
                    });
                })(),
            ]);
        });
    }
    async start(connection) {
        logger_1.default.tag('client').verbose('starting');
        if (connection) {
            this.connection = connection;
        }
        this.channel = await this.connection.createChannel();
        if (this.options.noResponse) {
            return;
        }
        await this.channel.assertQueue(this.callback, {
            messageTtl: this.options.timeout,
            expires: 600000,
            durable: true,
        });
        const { options } = this;
        await this.channel.consume(this.callback, async (message) => {
            if (!message) {
                return;
            }
            const { properties: { correlationId }, } = message;
            let response = JSON.parse(message.content.toString());
            if (!ramda_1.default.isNil(response.result) && options.deserialize) {
                response = Object.assign({}, response, { result: deserialize_1.default(response.result) });
            }
            logger_1.default
                .tag('client')
                .tag('response')
                .verbose({ response });
            const { error } = response;
            const callback = this.callbacks.get(correlationId);
            if (callback) {
                if (error) {
                    if (error.name === 'AppError') {
                        callback.reject(new onewallet_library_error_1.default(error.code, error.message, { original: error }));
                    }
                    else {
                        callback.reject(new onewallet_library_error_1.default('SERVER_ERROR', error.message, { original: error }));
                    }
                }
                else {
                    callback.resolve(response.result);
                }
                this.callbacks.delete(correlationId);
            }
        }, { noAck: true });
        logger_1.default.tag('client').verbose('started');
    }
    async stop() {
        await this.taskQueue.onEmpty();
        if (this.channel) {
            await this.channel.close();
        }
    }
}
exports.default = Client;
//# sourceMappingURL=client.js.map