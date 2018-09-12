# `onewallet-util-rabbit`

A simple microservice framework based on RabbitMQ.

## RPC

```javascript
import Rabbit from 'rabbit';

const rabbit = new Rabbit();

async main() {
  await rabbit.createWorker(
    'myqueue',
    async message => message
  );
  const sendRequest = rabbit.createClient('myqueue');

  const result = await sendRequest('Hello World!');
  assert.equal(result, 'Hello World!');
}

main();
```

## Fire and Forget

```javascript
import Rabbit from 'rabbit';

const rabbit = new Rabbit();

async main() {
  await rabbit.createWorker(
    'myqueue',
    async message => assert.equal(result, 'Hello World!')
  );
  const sendMessage = rabbit.createClient('myqueue', { noReponse: true });

  sendMessage('Hello World!');
}

main();
```

## PubSub

```javascript
import Rabbit from 'rabbit';

const rabbit = new Rabbit();

async main() {
  await rabbit.createSubscriber(
    'myexchange',
    async message => assert.equal(message, 'Hello World!'),
    { topic: 'mytopic' }
  );
  const publish = rabbit.createPublisher('myexchange');

  await publish('mytopic', 'Hello World!');
}

main();
```

## API

### `new Rabbit([options])`

```javascript
const rabbit = new Rabbit();
```

```javascript
const rabbit = new Rabbit({
  uri: 'amqp://localhost',
  prefix: '',
});
```

#### Arguments

- `options` - Rabbit options.
- `options.uri` - RabbitMQ URI. Default value is `'amqp://localhost'`.
- `options.prefix` - Queue/Exchange name prefix. Default value is `''`.

### `rabbit.createClient(scope[, options])`

```javascript
const sendMessage = await rabbit.createClient('myscope');
```

```javascript
const sendMessage = await rabbit.createClient('myscope', {
  timeout: 60000,
  noResponse: false,
});
```

#### Arguments

- `scope` - Scope. `required`.
- `options` - Client options.
- `options.timeout` - Time until request is dropped. Default value is `60000`.
- `options.noResponse` - If set to `true`, client will not wait for response. Default value is `false`.

### `rabbit.createWorker(scope, handler[, options])`

```javascript
await rabbit.createWorker('myscope', async message => {
  // handler message here
});
```

```javascript
await rabbit.createWorker(
  'myscope',
  async message => {
    // handler message here
  },
  {
    concurrency: 10,
  }
);
```

#### Arguments

- `scope` - Scope. `required`.
- `handler` - Function to be executed when worker receives a message. `required`.
- `options` - Worker options.
- `options.concurrency` - Number of messages that the worker can handle at the same time . Default value is `1`.

### `rabbit.createPublisher(scope)`

```javascript
const publish = await rabbit.createPublisher('scope');
```

#### Arguments

- `scope` - Scope. `required`.

### `rabbit.createSubscriber(scope, handler[, options])`

```javascript
await rabbit.createWorker('myscope', async message => {
  // handler message here
});
```

```javascript
const sendRequest = await rabbit.createClient('myscope', {
  timeout: 60000,
  noResponse: false,
});
```

#### Arguments

- `scope` - Scope. `required`.
- `handler` - Function to be executed when subscriber receives a message. `required`.
- `options` - Subscriber options.
- `options.topic` - Used to filter messages based on topic. Default value is `*`.
- `options.concurrency` - Number of messages that the subscriber can handle at the same time. Default value is `1`.
