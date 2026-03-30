const request = require('supertest');

// Mock DB before requiring app
jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  connect: jest.fn(),
  on: jest.fn(),
}));

const app = require('../src/app');
const pool = require('../src/config/database');

describe('Classes API', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── GET /api/classes ──────────────────────────────────
  describe('GET /api/classes', () => {
    it('returns the list of classes', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1, label: '3A', year: 2025 }] });

      const res = await request(app).get('/api/classes');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].label).toBe('3A');
    });

    it('returns an empty array when no classes exist', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const res = await request(app).get('/api/classes');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  // ── POST /api/classes ─────────────────────────────────
  describe('POST /api/classes', () => {
    it('creates a class and returns 201', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1, label: '3B', year: 2025 }] });

      const res = await request(app)
        .post('/api/classes')
        .send({ label: '3B', year: 2025 });

      expect(res.status).toBe(201);
      expect(res.body.label).toBe('3B');
    });

    it('returns 400 when label is missing', async () => {
      const res = await request(app)
        .post('/api/classes')
        .send({ year: 2025 });

      expect(res.status).toBe(400);
    });

    it('returns 409 on duplicate label', async () => {
      pool.query.mockRejectedValue(
        Object.assign(new Error('duplicate key'), { code: '23505', detail: 'Key (label)=(3B) already exists.' })
      );

      const res = await request(app)
        .post('/api/classes')
        .send({ label: '3B' });

      expect(res.status).toBe(409);
    });
  });

  // ── PUT /api/classes/:id ──────────────────────────────
  describe('PUT /api/classes/:id', () => {
    it('updates and returns the class', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1, label: '3C', year: 2025 }] });

      const res = await request(app)
        .put('/api/classes/1')
        .send({ label: '3C', year: 2025 });

      expect(res.status).toBe(200);
      expect(res.body.label).toBe('3C');
    });

    it('returns 404 when class not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const res = await request(app)
        .put('/api/classes/999')
        .send({ label: '3C' });

      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /api/classes/:id ───────────────────────────
  describe('DELETE /api/classes/:id', () => {
    it('deletes and returns 204', async () => {
      pool.query.mockResolvedValue({ rowCount: 1 });

      const res = await request(app).delete('/api/classes/1');
      expect(res.status).toBe(204);
    });

    it('returns 404 when class not found', async () => {
      pool.query.mockResolvedValue({ rowCount: 0 });

      const res = await request(app).delete('/api/classes/999');
      expect(res.status).toBe(404);
    });
  });
});
