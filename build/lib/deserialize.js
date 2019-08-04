"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ramda_1 = __importDefault(require("ramda"));
function deserialize(object) {
    const type = typeof object;
    if (type === 'object') {
        if (object === null) {
            return null;
        }
        if (object.__classObject) {
            if (object.type === 'Date') {
                return new Date(object.data);
            }
            if (object.type === 'Set') {
                return new Set(object.data);
            }
            if (object.type === 'Map') {
                return new Map(object.data);
            }
            if (object.type === 'Buffer') {
                return Buffer.from(object.data, 'base64');
            }
        }
        return ramda_1.default.map(deserialize)(object);
    }
    return object;
}
exports.default = deserialize;
//# sourceMappingURL=deserialize.js.map