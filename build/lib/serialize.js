"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ramda_1 = __importDefault(require("ramda"));
function serialize(object) {
    const type = typeof object;
    if (type === 'object') {
        if (object instanceof Date) {
            return {
                __classObject: true,
                type: 'Date',
                data: object.toISOString(),
            };
        }
        if (object instanceof Set) {
            return {
                __classObject: true,
                type: 'Set',
                data: Array.from(object),
            };
        }
        if (object instanceof Map) {
            return {
                __classObject: true,
                type: 'Map',
                data: Array.from(object),
            };
        }
        if (object === null) {
            return null;
        }
        return ramda_1.default.map(serialize)(object);
    }
    return object;
}
exports.default = serialize;
//# sourceMappingURL=serialize.js.map