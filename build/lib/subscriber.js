"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var uuid_1 = require("uuid");
var p_queue_1 = __importDefault(require("p-queue"));
var onewallet_library_error_1 = __importDefault(require("onewallet.library.error"));
var logger_1 = __importDefault(require("./logger"));
var Subscriber = (function () {
    function Subscriber(connection, exchange, handler, options) {
        this.connection = connection;
        this.exchange = exchange;
        this.handler = handler;
        this.channel = null;
        this.options = {
            topics: [],
            concurrency: 1,
        };
        if (options) {
            this.options = __assign({}, this.options, options);
        }
        this.queue = "subscriber." + (this.options.queue || uuid_1.v4().replace('-', ''));
        this.topics = this.options.topics;
        this.taskQueue = new p_queue_1.default();
    }
    Subscriber.prototype.addTopic = function (topic) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.channel) {
                            throw new onewallet_library_error_1.default('CHANNEL_NOT_READY', 'Channel is not ready.');
                        }
                        this.topics.push(topic);
                        return [4, this.channel.bindQueue(this.queue, this.exchange, topic)];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    Subscriber.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4, this.connection.createChannel()];
                    case 1:
                        _a.channel = _b.sent();
                        return [4, this.channel.assertQueue(this.queue, {
                                exclusive: false,
                                durable: true,
                                expires: 600000,
                            })];
                    case 2:
                        _b.sent();
                        return [4, this.channel.assertExchange(this.exchange, 'topic', {
                                durable: true,
                            })];
                    case 3:
                        _b.sent();
                        return [4, Promise.all(this.topics.map(function (topic) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (!this.channel) return [3, 2];
                                            return [4, this.channel.bindQueue(this.queue, this.exchange, topic)];
                                        case 1:
                                            _a.sent();
                                            _a.label = 2;
                                        case 2: return [2];
                                    }
                                });
                            }); }))];
                    case 4:
                        _b.sent();
                        return [4, this.channel.prefetch(this.options.concurrency)];
                    case 5:
                        _b.sent();
                        return [4, this.channel.consume(this.queue, function (message) { return __awaiter(_this, void 0, void 0, function () {
                                var _this = this;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4, this.taskQueue.add(function () { return __awaiter(_this, void 0, void 0, function () {
                                                var payload, result, err_1;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            if (!message || !this.channel) {
                                                                return [2];
                                                            }
                                                            payload = JSON.parse(message.content.toString());
                                                            logger_1.default.tag('subscriber').verbose(payload);
                                                            _a.label = 1;
                                                        case 1:
                                                            _a.trys.push([1, 4, , 5]);
                                                            result = this.handler.apply(this.handler, payload.arguments);
                                                            if (!(!(result === null || result === undefined) &&
                                                                typeof result.then === 'function')) return [3, 3];
                                                            return [4, result];
                                                        case 2:
                                                            result = _a.sent();
                                                            _a.label = 3;
                                                        case 3: return [3, 5];
                                                        case 4:
                                                            err_1 = _a.sent();
                                                            return [3, 5];
                                                        case 5: return [4, this.channel.ack(message)];
                                                        case 6:
                                                            _a.sent();
                                                            return [2];
                                                    }
                                                });
                                            }); })];
                                        case 1:
                                            _a.sent();
                                            return [2];
                                    }
                                });
                            }); }, { noAck: false })];
                    case 6:
                        _b.sent();
                        return [2];
                }
            });
        });
    };
    Subscriber.prototype.stop = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.taskQueue.onEmpty()];
                    case 1:
                        _a.sent();
                        if (!this.channel) return [3, 3];
                        return [4, this.channel.close()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2];
                }
            });
        });
    };
    return Subscriber;
}());
exports.default = Subscriber;
//# sourceMappingURL=subscriber.js.map