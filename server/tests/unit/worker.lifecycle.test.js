jest.mock('bullmq', () => {
  class FakeWorker {
    constructor(name, processor, opts) {
      this.name = name;
      this.processor = processor;
      this.opts = opts;
      this._handlers = {};
    }
    on(evt, cb) { this._handlers[evt] = cb; }
    async close() { /* noop */ }
  }
  return { Worker: FakeWorker };
});

jest.mock('../../src/config/database', () => ({
  knowledgeChunk: {
    findUnique: jest.fn().mockResolvedValue({ id: 'chunk1', content: 'hello world', metadata: {}, embedding: null }),
    update: jest.fn().mockResolvedValue(true)
  },
  $executeRaw: jest.fn().mockResolvedValue(true)
}));

describe('Worker lifecycle', () => {
  test('startWorker and stopWorker lifecycle works with mocked bullmq and prisma', async () => {
    const { startWorker, stopWorker } = require('../../src/queue/worker');
    const worker = await startWorker();
    expect(worker).toBeDefined();
    await stopWorker();
  });
});
