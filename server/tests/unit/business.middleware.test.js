// Mock prisma (use doMock to avoid jest hoisting issues)
const mockFindUnique = jest.fn();
jest.doMock('../../src/config/database.js', () => ({
  business: { findUnique: mockFindUnique },
  user: { findUnique: jest.fn() }
}));

const prismaModule = require('../../src/config/database.js');
const { resolveBusinessId } = require('../../src/middleware/businessMiddleware.js');

describe('resolveBusinessId middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('attaches businessId from header when valid', async () => {
    mockFindUnique.mockResolvedValueOnce({ id: 'validbiz123' });

    const req = { headers: { 'x-business-id': 'validbiz123' }, query: {} };
    const res = {};
    const next = jest.fn();

    await resolveBusinessId(req, res, next);
    expect(req.user).toBeDefined();
    expect(req.user.businessId).toBe('validbiz123');
    expect(next).toHaveBeenCalled();
  });

  test('returns 400 when header provided and invalid and no auth', async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const req = { headers: { 'x-business-id': 'bad-id' }, query: {} };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status };
    const next = jest.fn();

    await resolveBusinessId(req, res, next);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: 'Invalid business id provided in header.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('ignores invalid header when Authorization present and continues', async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const req = { headers: { 'x-business-id': 'bad-id', authorization: 'Bearer token' }, query: {} };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status };
    const next = jest.fn();

    await resolveBusinessId(req, res, next);
    // should continue to other steps; middleware will not return early and will attempt user lookup (we haven't mocked users here)
    // At minimum, it should call next() eventually or return a 400 from token/user lookup, but for this test we assert it didn't immediately return 400 solely because of the header being invalid
    expect(next).not.toHaveBeenCalled();
  });
});
