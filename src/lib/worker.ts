import { Connection, Channel } from 'amqplib';
import * as R from 'ramda';
import { RequestMessage, WorkerOptions, ResponseMessage } from './types';

export default class Worker {
  private channel: Channel;
  constructor(
    public connection: Connection,
    private options: WorkerOptions,
    public handler: () => Promise<any>
  ) {}
  async start() {
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(this.options.queue.name, {
      exclusive: false,
      durable: true,
      autoDelete: false,
      messageTtl: this.options.queue.messageTtl,
      maxLength: this.options.queue.maxLength,
    });
    await this.channel.prefetch(this.options.concurrency || 1);

    await this.channel.consume(
      this.options.queue.name,
      async message => {
        if (!message) {
          return;
        }

        const {
          properties: { correlationId },
        } = message;

        const request: RequestMessage = JSON.parse(message.content.toString());

        let response: ResponseMessage = { correlationId };
        try {
          let result = this.handler.apply(this.handler, request.arguments);

          if (!R.isNil(result) && typeof result.then === 'function') {
            result = await result;
          }
          response.result = result;
        } catch (err) {
          const error = { message: err.message };
          for (const key in err) {
            error[key] = err[key];
          }
          response.error = error;
        }

        await this.channel.ack(message);

        if (request.noResponse) {
          return;
        }

        await this.channel.sendToQueue(
          message.properties.replyTo,
          new Buffer(JSON.stringify(response)),
          { correlationId, persistent: true }
        );
      },
      { noAck: false }
    );
  }
  async stop() {}
}
