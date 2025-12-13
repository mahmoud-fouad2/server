const express = require('express');
const request = require('supertest');
const { generateCSRFToken, validateCSRFToken } = require('../../src/middleware/csrf');

describe('CSRF middleware', () => {
  let app;
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.get('/get', generateCSRFToken, (req, res) => res.status(200).send('ok'));
    app.post('/post', validateCSRFToken, (req, res) => res.status(200).send('posted'));
  });

  test('generates token header and validates subsequent request', async () => {
    const getRes = await request(app).get('/get');
    expect(getRes.status).toBe(200);
    const token = getRes.headers['x-csrf-token'];
    expect(token).toBeDefined();

    const postRes = await request(app).post('/post').set('X-CSRF-Token', token).send({});
    expect(postRes.status).toBe(200);
  });

  test('rejects missing token', async () => {
    const postRes = await request(app).post('/post').send({});
    expect(postRes.status).toBe(403);
  });
});
