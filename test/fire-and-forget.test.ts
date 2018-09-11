import * as sinon from 'sinon';
import * as randomstring from 'randomstring';
import { expect } from 'chai';
import * as R from 'ramda';
import Rabbit from '../src';
import delay from '../src/lib/delay';

describe('Fire and Forget', () => {
  let prefix;
  let rabbit;

  beforeEach(async () => {
    prefix = randomstring.generate(6);
    rabbit = new Rabbit({ prefix });
  });

  afterEach(async () => {
    await rabbit.stop();
  });

  it('should send message to worker', async () => {
    const handler = sinon.fake();
    const queue = 'test_queue';

    await rabbit.createWorker(
      {
        queue: {
          name: queue,
        },
      },
      handler
    );

    const client = await rabbit.createClient(queue, { noResponse: true });

    const message = { message: 'Hello World!' };
    await client(message);
    await delay(100);

    expect(handler.calledOnce).to.be.equal(true);
    expect(handler.args[0][0]).to.be.deep.equal(message);
  });

  it('should distribute messages to multile workers', async () => {
    const queue = 'test_queue';

    const handlers = await Promise.all(
      R.times(async () => {
        const handler = sinon.fake();

        await rabbit.createWorker(
          {
            queue: {
              name: queue,
            },
          },
          handler
        );

        return handler;
      })(3)
    );

    const client = await rabbit.createClient(queue, { noResponse: true });

    await Promise.all(
      R.times(async () => {
        const message = { message: randomstring.generate(8) };
        await client(message);
      })(20)
    );
    await delay(100);

    expect(
      R.reduce(R.add, '0')(R.map(R.prop('callCount'))(handlers))
    ).to.be.equal(20);
    for (const handler of handlers) {
      expect(handler.callCount).to.be.greaterThan(0);
    }
  });

  it('should send messages from multiple clients', async () => {
    const queue = 'test_queue';

    const handler = sinon.fake();
    await rabbit.createWorker(
      {
        queue: {
          name: queue,
        },
      },
      handler
    );

    await Promise.all(
      R.times(async () => {
        const client = await rabbit.createClient(queue, { noResponse: true });

        await Promise.all(
          R.times(async () => {
            const message = { message: randomstring.generate(6) };
            await delay(100 * Math.random());
            await client(message);
          })(5)
        );
      })(4)
    );
    await delay(200);

    expect(handler.callCount).to.be.equal(20);
  });
});
