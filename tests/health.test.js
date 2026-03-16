process.env.APP_VERSION = 'test-version';
process.env.JWT_SECRET = 'test-secret';

jest.mock('../src/db', () => ({
  query: jest.fn(() => Promise.resolve({ rows: [{ '?column?': 1 }], rowCount: 1 })),
  pool: { end: jest.fn() }
}));

const request = require('supertest');
const app = require('../src/app');

describe('Health endpoints', () => {
  test('GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('GET /version returns configured version', async () => {
    const res = await request(app).get('/version');
    expect(res.status).toBe(200);
    expect(res.body.version).toBe('test-version');
  });

  test('GET /ready returns 200 when DB ok', async () => {
    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
    expect(res.body.db).toBe('ok');
  });
});

