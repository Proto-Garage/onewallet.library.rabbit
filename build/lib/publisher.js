"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const onewallet_library_error_1 = __importDefault(require("onewallet.library.error"));
const logger_1 = __importDefault(require("./logger"));
const serialize_1 = __importDefault(require("./serialize"));
class Publisher {
    constructor(connection, exchange, options) {
        this.exchange = exchange;
        this.channel = null;
        this.options = {
            serialize: true,
        };
        if (options) {
            this.options = Object.assign({}, this.options, options);
        }
        this.connection = connection;
    }
    async send(topic, ...args) {
        if (!this.channel) {
            throw new onewallet_library_error_1.default('CHANNEL_NOT_READY', 'Channel not started.');
        }
        const payload = {
            arguments: this.options.serialize ? serialize_1.default(args) : args,
            timestamp: Date.now(),
        };
        logger_1.default.tag('publisher').verbose(payload);
        await this.channel.publish(this.exchange, topic, Buffer.from(JSON.stringify(payload)), { persistent: true });
    }
    async start(connection) {
        logger_1.default.tag('publisher').verbose('starting');
        if (connection) {
            this.connection = connection;
        }
        this.channel = await this.connection.createChannel();
        await this.channel.assertExchange(this.exchange, 'topic', {
            durable: true,
        });
        logger_1.default.tag('publisher').verbose('started');
    }
    async stop() {
        if (this.channel) {
            await this.channel.close();
        }
    }
}
exports.default = Publisher;
//# sourceMappingURL=publisher.js.map