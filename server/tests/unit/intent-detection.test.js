const intentDetection = require('../../src/services/intent-detection.service');

describe('Intent Detection Service', () => {
  test('should classify "انت مين" as QUESTION (not OFF_TOPIC or CLOSING)', () => {
    const res = intentDetection.detectIntent('انت مين', []);
    expect(res.intent).toBe('QUESTION');
  });

  test('should not classify "تمام" as CLOSING', () => {
    const res = intentDetection.detectIntent('تمام', []);
    expect(res.intent).not.toBe('CLOSING');
  });

  test('should classify "شكراً" as CLOSING', () => {
    const res = intentDetection.detectIntent('شكراً', []);
    expect(res.intent).toBe('CLOSING');
  });
});
