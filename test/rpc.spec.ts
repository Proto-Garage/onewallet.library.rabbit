import sinon from 'sinon';
import R from 'ramda';
import randomstring from 'randomstring';
import { expect } from 'chai';
import delay from '../src/lib/delay';
import Rabbit from '../src';

describe('RPC', () => {
  let prefix;
  let rabbit: Rabbit;

  beforeEach(async () => {
    prefix = randomstring.generate(6);
    rabbit = new Rabbit({ prefix });
  });

  afterEach(async () => {
    await rabbit.stop();
  });

  it('should send request to worker', async () => {
    const handler = sinon.fake((message: { operand: number }) => ({
      square: message.operand * message.operand,
    }));
    const queue = 'test_queue';

    await rabbit.createWorker(queue, handler);

    const client = await rabbit.createClient(queue);
    const result = await client({ operand: 3 });

    expect(handler.calledOnce).to.be.equal(true);
    expect(result).to.deep.equal({ square: 9 });
  });

  it('should distribute requests to multile workers', async () => {
    const queue = 'test_queue';

    const handlers = await Promise.all(
      R.times(async () => {
        const handler = sinon.fake((message: { operand: number }) => ({
          square: message.operand * message.operand,
        }));

        await rabbit.createWorker(queue, handler);

        return handler;
      })(3)
    );

    const client = await rabbit.createClient(queue);

    await Promise.all(
      R.times(async () => {
        const message = { operand: Math.floor(Math.random() * 100) };
        await delay(Math.random() * 100);
        const result = await client(message);
        expect(result.square).to.equal(message.operand * message.operand);
      })(20)
    );

    expect(
      R.compose(
        R.reduce<number, number>(R.add, 0),
        R.map<sinon.SinonSpy, number>(R.prop('callCount'))
      )(handlers)
    ).to.be.equal(20);
    for (const handler of handlers) {
      expect(handler.callCount).to.be.greaterThan(0);
    }
  });

  it('should send request from multiple clients', async () => {
    const queue = 'test_queue';

    const handler = sinon.fake((message: { operand: number }) => ({
      square: message.operand * message.operand,
    }));

    await rabbit.createWorker(queue, handler);

    await Promise.all(
      R.times(async () => {
        const client = await rabbit.createClient(queue);

        await Promise.all(
          R.times(async () => {
            const message = { operand: Math.floor(Math.random() * 100) };
            await delay(Math.random() * 100);
            const result = await client(message);
            expect(result.square).to.equal(message.operand * message.operand);
          })(5)
        );
      })(4)
    );
    await delay(200);

    expect(handler.callCount).to.be.equal(20);
  });
});
