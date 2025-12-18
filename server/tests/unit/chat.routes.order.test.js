const fs = require('fs');
const path = require('path');

describe('Route ordering: /conversations and /handover-requests (static check)', () => {
  test('router defines /conversations and /handover-requests before the generic /:conversationId', () => {
    const filePath = path.join(__dirname, '../../src/routes/chat.routes.js');
    const content = fs.readFileSync(filePath, 'utf8');

    const convIndex = content.indexOf("router.get('/conversations'");
    const handoverIndex = content.indexOf("router.get('/handover-requests'");
    const paramIndex = content.indexOf("router.get('/:conversationId'");

    expect(convIndex).toBeGreaterThan(-1);
    expect(handoverIndex).toBeGreaterThan(-1);
    expect(paramIndex).toBeGreaterThan(-1);

    // Both specific routes must appear before the param route
    expect(convIndex).toBeLessThan(paramIndex);
    expect(handoverIndex).toBeLessThan(paramIndex);
  });
});
