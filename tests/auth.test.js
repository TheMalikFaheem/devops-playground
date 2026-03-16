process.env.JWT_SECRET = 'test-secret';

jest.mock('../src/db', () => ({
  query: jest.fn(),
  pool: { end: jest.fn() }
}));

const bcrypt = require('bcryptjs');
const request = require('supertest');

const db = require('../src/db');

const app = require('../src/app');

describe('Auth endpoints', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  test('POST /auth/register sets JWT cookie and redirects', async () => {
    db.query
      .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // email exists check
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, username: 'u1', role: 'user' }] }); // insert

    const res = await request(app)
      .post('/auth/register')
      .type('form')
      .send({ username: 'u1', email: 'u1@example.com', password: 'pw' });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/projects');
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'].join(';')).toMatch(/token=/);
  });

  test('POST /auth/login sets JWT cookie and redirects', async () => {
    const passwordHash = await bcrypt.hash('pw', 10);
    db.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [
        {
          id: 2,
          username: 'u2',
          email: 'u2@example.com',
          password_hash: passwordHash,
          role: 'user'
        }
      ]
    });

    const res = await request(app)
      .post('/auth/login')
      .type('form')
      .send({ email: 'u2@example.com', password: 'pw' });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/projects');
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'].join(';')).toMatch(/token=/);
  });

  test('GET /projects requires auth', async () => {
    const res = await request(app).get('/projects');
    expect(res.status).toBe(401);
  });
});

