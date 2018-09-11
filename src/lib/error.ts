export default class RabbitError extends Error {
  constructor(private code: string, message: string, private meta?: Object) {
    super(`${code} - ${message}`);
  }

  toJSON() {
    return {
      ...(this.meta || {}),
      message: this.message,
      code: this.code,
    };
  }
}
