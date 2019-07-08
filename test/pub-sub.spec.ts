import sinon from 'sinon';
import randomstring from 'randomstring';
import R from 'ramda';
import { expect } from 'chai';
import Rabbit from '../src';
import delay from '../src/lib/delay';

describe('PubSub', () => {
  let prefix;
  let rabbit: Rabbit;

  beforeEach(async () => {
    prefix = randomstring.generate(6);
    rabbit = new Rabbit({ prefix });
  });

  afterEach(async () => {
    await rabbit.stop();
  });

  it('should publish message to subscriber', async () => {
    const handler = sinon.fake();
    const exchange = 'test_exchange';

    await rabbit.createSubscriber(exchange, handler, { topics: ['*'] });

    const publish = await rabbit.createPublisher(exchange);
    const message = { message: 'Hello World!' };
    await publish('topic', message);
    await delay(100);
    expect(handler.calledOnce).to.be.equal(true);
    expect(handler.args[0][0]).to.be.deep.equal(message);
  });

  it('should publish message to multiple subscribers', async () => {
    const exchange = 'test_exchange';

    const handlers = await Promise.all(
      R.times(async () => {
        const handler = sinon.fake();

        await rabbit.createSubscriber(exchange, handler, { topics: ['topic'] });
        return handler;
      })(5)
    );

    const publish = await rabbit.createPublisher(exchange);
    const message = { message: 'Hello World!' };
    await publish('topic', message);
    await delay(100);

    handlers.map((handler) => {
      expect(handler.calledOnce).to.equal(true);
      expect(handler.args[0][0]).to.deep.equal(message);
    });
  });

  it('should receive messages from multiple publishers with different topics', async () => {
    const handler = sinon.fake();
    const exchange = 'test_exchange';

    await rabbit.createSubscriber(exchange, handler, { topics: ['*'] });

    const publish = await rabbit.createPublisher(exchange);
    await Promise.all(
      R.times(async index => publish(`topic${index}`, { message: 'Hello World!' }))(5)
    );
    await delay(100);
    expect(handler.callCount).to.be.equal(5);
  });

  it('should send messages to subscribers with appropriate topics', async () => {
    const exchange = 'test_exchange';

    const handlerRed = sinon.fake();
    const handlerGreen = sinon.fake();
    const handlerBlue = sinon.fake();
    const handlerAll = sinon.fake();

    await rabbit.createSubscriber(exchange, handlerRed, {
      topics: ['number.red'],
    });
    await rabbit.createSubscriber(exchange, handlerGreen, {
      topics: ['number.green'],
    });
    await rabbit.createSubscriber(exchange, handlerBlue, {
      topics: ['number.blue'],
    });
    await rabbit.createSubscriber(exchange, handlerAll, {
      topics: ['number.*'],
    });

    const publish = await rabbit.createPublisher(exchange);
    await publish('number.red', { color: 'red' });
    await publish('number.green', { color: 'green' });
    await publish('number.blue', { color: 'blue' });
    await delay(100);

    expect(handlerRed.callCount).to.be.equal(1);
    expect(handlerRed.args[0][0]).to.deep.equal({ color: 'red' });
    expect(handlerGreen.callCount).to.be.equal(1);
    expect(handlerGreen.args[0][0]).to.deep.equal({ color: 'green' });
    expect(handlerBlue.callCount).to.be.equal(1);
    expect(handlerBlue.args[0][0]).to.deep.equal({ color: 'blue' });
    expect(handlerAll.callCount).to.be.equal(3);
  });

  it('should add topic', async () => {
    const exchange = 'test_exchange';

    const handler = sinon.fake();

    const subscriber = await rabbit.createSubscriber(exchange, handler);
    await subscriber.addTopic('number.red');
    await subscriber.addTopic('number.green');
    await subscriber.addTopic('number.blue');
    const publish = await rabbit.createPublisher(exchange);
    await publish('number.red', { color: 'red' });
    await publish('number.green', { color: 'green' });
    await publish('number.blue', { color: 'blue' });
    await delay(100);

    expect(handler.callCount).to.be.equal(3);
  });
});
