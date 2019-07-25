"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const amqplib_1 = require("amqplib");
const retry_1 = __importDefault(require("retry"));
const logger_1 = __importDefault(require("./lib/logger"));
const client_1 = __importDefault(require("./lib/client"));
exports.Client = client_1.default;
const worker_1 = __importDefault(require("./lib/worker"));
exports.Worker = worker_1.default;
const publisher_1 = __importDefault(require("./lib/publisher"));
exports.Publisher = publisher_1.default;
const subscriber_1 = __importDefault(require("./lib/subscriber"));
exports.Subscriber = subscriber_1.default;
const serialize_1 = __importDefault(require("./lib/serialize"));
exports.serialize = serialize_1.default;
const deserialize_1 = __importDefault(require("./lib/deserialize"));
exports.deserialize = deserialize_1.default;
class Rabbit {
    constructor(options) {
        this.connection = null;
        this.stopping = false;
        this.options = {
            uri: 'amqp://localhost',
        };
        this.channels = [];
        if (options) {
            this.options = Object.assign({}, this.options, options);
        }
        const establishConnection = () => new Promise((resolve) => {
            const operation = retry_1.default.operation({
                forever: true,
                factor: 2,
                minTimeout: 1000,
                maxTimeout: 30000,
                randomize: true,
            });
            operation.attempt(async () => {
                logger_1.default.info('establishing connection');
                try {
                    const connection = await amqplib_1.connect(this.options.uri);
                    connection.on('close', () => {
                        logger_1.default.info('disconnected');
                        if (!this.stopping) {
                            this.connecting = establishConnection();
                        }
                    });
                    connection.on('error', (err) => {
                        logger_1.default.error(err.message);
                    });
                    await Promise.all(this.channels.map(channel => channel.start(connection)));
                    logger_1.default.info('connected');
                    this.connection = connection;
                    resolve(connection);
                }
                catch (err) {
                    logger_1.default.error(err.message);
                    operation.retry(err);
                }
            });
        });
        this.connecting = establishConnection();
    }
    async createClient(scope, options) {
        const connection = await this.connecting;
        const client = new client_1.default(connection, `${this.options.prefix || ''}${scope}`, options);
        await client.start();
        this.channels.push(client);
        return (...args) => client.send(...args);
    }
    async createWorker(scope, handler, options) {
        const connection = await this.connecting;
        const worker = new worker_1.default(connection, `${this.options.prefix || ''}${scope}`, handler, options);
        await worker.start();
        this.channels.push(worker);
        return worker;
    }
    async createPublisher(scope) {
        const connection = await this.connecting;
        const publisher = new publisher_1.default(connection, `${this.options.prefix || ''}${scope}`);
        await publisher.start();
        this.channels.push(publisher);
        return async function publish(topic, ...args) {
            return publisher.send.apply(publisher, [topic, ...args]);
        };
    }
    async createSubscriber(scope, handler, options) {
        const connection = await this.connecting;
        const subscriber = new subscriber_1.default(connection, `${this.options.prefix || ''}${scope}`, handler, options);
        await subscriber.start();
        this.channels.push(subscriber);
        return subscriber;
    }
    async stop() {
        this.stopping = true;
        await Promise.all(this.channels.map(channel => channel.stop()));
        if (this.connection) {
            await this.connection.close();
        }
    }
}
exports.default = Rabbit;
//# sourceMappingURL=index.js.map