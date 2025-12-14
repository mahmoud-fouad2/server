const notificationsController = require('../../src/controllers/notifications.controller');
const prisma = require('../../src/config/database');

describe('Notifications Controller', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('getUnreadCount returns tickets count (distinct tickets with unread messages), not message count', async () => {
    const req = { user: { userId: 'user1', businessId: 'biz1' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { json, status };

    // Mock prisma counts
    prisma.ticket = { count: jest.fn().mockResolvedValue(1) };
    prisma.message = { count: jest.fn().mockResolvedValue(0) };
    prisma.notification = { count: jest.fn().mockResolvedValue(0) };

    await notificationsController.getUnreadCount(req, res);

    expect(prisma.ticket.count).toHaveBeenCalled();
    expect(prisma.message.count).toHaveBeenCalled();
    expect(prisma.notification.count).toHaveBeenCalled();
    expect(json).toHaveBeenCalledWith({ ticketsUnread: 1, messagesUnread: 0, notificationsUnread: 0 });
  });
});
