/// <reference types="chai" />
export default class RabbitError extends Error {
    private code;
    private meta?;
    constructor(code: string, message: string, meta?: Object | undefined);
    toJSON(): {
        message: string;
        code: string;
        constructor: Function;
        toString(): string;
        toLocaleString(): string;
        valueOf(): Object;
        hasOwnProperty(v: string | number | symbol): boolean;
        isPrototypeOf(v: Object): boolean;
        propertyIsEnumerable(v: string | number | symbol): boolean;
        should: Chai.Assertion;
    };
}
//# sourceMappingURL=error.d.ts.map