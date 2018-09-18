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
var logger_1 = __importDefault(require("./logger"));
var delay_1 = __importDefault(require("./delay"));
var error_1 = __importDefault(require("./error"));
var Client = (function () {
    function Client(connection, queue, options) {
        this.connection = connection;
        this.queue = queue;
        this.channel = null;
        this.options = {
            timeout: 60000,
            noResponse: false,
        };
        if (options) {
            this.options = __assign({}, this.options, options);
        }
        this.callback = "callback." + uuid_1.v1().replace('-', '');
        this.callbacks = new Map();
        this.taskQueue = new p_queue_1.default();
    }
    Client.prototype.send = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2, this.taskQueue.add(function () { return __awaiter(_this, void 0, void 0, function () {
                        var correlationId, request, promise;
                        var _this = this;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!this.channel) {
                                        throw new error_1.default('CHANNEL_NOT_READY', 'Channel not started.');
                                    }
                                    correlationId = uuid_1.v1().replace(/-/g, '');
                                    request = {
                                        correlationId: correlationId,
                                        arguments: args,
                                        noResponse: this.options.noResponse,
                                        timestamp: Date.now(),
                                    };
                                    logger_1.default
                                        .tag('client')
                                        .tag('request')
                                        .verbose(request);
                                    return [4, this.channel.sendToQueue(this.queue, new Buffer(JSON.stringify(request)), {
                                            correlationId: correlationId,
                                            replyTo: this.callback,
                                            persistent: true,
                                            expiration: this.options.timeout,
                                        })];
                                case 1:
                                    _a.sent();
                                    if (this.options.noResponse) {
                                        return [2];
                                    }
                                    promise = new Promise(function (resolve, reject) {
                                        _this.callbacks.set(correlationId, { resolve: resolve, reject: reject });
                                    });
                                    return [2, Promise.race([
                                            promise,
                                            (function () { return __awaiter(_this, void 0, void 0, function () {
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0: return [4, delay_1.default(this.options.timeout)];
                                                        case 1:
                                                            _a.sent();
                                                            this.callbacks.delete(correlationId);
                                                            throw new error_1.default('TIMEOUT', 'Request timeout.', {
                                                                queue: this.queue,
                                                                arguments: args,
                                                            });
                                                    }
                                                });
                                            }); })(),
                                        ])];
                            }
                        });
                    }); })];
            });
        });
    };
    Client.prototype.start = function () {
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
                        if (this.options.noResponse) {
                            return [2];
                        }
                        return [4, this.channel.assertQueue(this.callback, {
                                messageTtl: this.options.timeout,
                                expires: 600000,
                                durable: true,
                            })];
                    case 2:
                        _b.sent();
                        return [4, this.channel.consume(this.callback, function (message) { return __awaiter(_this, void 0, void 0, function () {
                                var correlationId, response, callback;
                                return __generator(this, function (_a) {
                                    if (!message) {
                                        return [2];
                                    }
                                    correlationId = message.properties.correlationId;
                                    response = JSON.parse(message.content.toString());
                                    logger_1.default
                                        .tag('client')
                                        .tag('response')
                                        .verbose(response);
                                    callback = this.callbacks.get(correlationId);
                                    if (callback) {
                                        if (response.result) {
                                            callback.resolve(response.result);
                                        }
                                        else {
                                            callback.reject(new error_1.default('WORKER_ERROR', 'Worker error', response.error));
                                        }
                                        this.callbacks.delete(correlationId);
                                    }
                                    return [2];
                                });
                            }); }, { noAck: true })];
                    case 3:
                        _b.sent();
                        return [2];
                }
            });
        });
    };
    Client.prototype.stop = function () {
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
    return Client;
}());
exports.default = Client;
//# sourceMappingURL=client.js.map