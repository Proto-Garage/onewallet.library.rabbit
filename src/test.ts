import Rabbit from './index';

const rabbit = new Rabbit();

rabbit.createWorker('test', async () => {});

setTimeout(() => {}, 600000);
