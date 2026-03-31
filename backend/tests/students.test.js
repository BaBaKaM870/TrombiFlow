const request = require('supertest');

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  connect: jest.fn(),
  on: jest.fn(),
}));

jest.mock('../src/services/imageService', () => ({
  resizePhoto: jest.fn().mockResolvedValue('/tmp/photo.jpg'),
}));

const app = require('../src/app');
const pool = require('../src/config/database');

describe('Students API', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── GET /api/students ─────────────────────────────────
  describe('GET /api/students', () => {
    it('returns all students', async () => {
      pool.query.mockResolvedValue({
        rows: [{ id: 1, first_name: 'Jean', last_name: 'Dupont', class_id: 1 }],
      });

      const res = await request(app).get('/api/students');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('filters by class_id', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const res = await request(app).get('/api/students?class_id=2');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('filters by search query q', async () => {
      pool.query.mockResolvedValue({
        rows: [{ id: 2, first_name: 'Marie', last_name: 'Curie', class_id: 1 }],
      });

      const res = await request(app).get('/api/students?q=Marie');
      expect(res.status).toBe(200);
      expect(res.body[0].first_name).toBe('Marie');
    });
  });

  // ── POST /api/students ────────────────────────────────
  describe('POST /api/students', () => {
    it('creates a student and returns 201', async () => {
      pool.query.mockResolvedValue({
        rows: [{ id: 1, first_name: 'Jean', last_name: 'Dupont', email: 'jean@school.fr' }],
      });

      const res = await request(app)
        .post('/api/students')
        .send({ first_name: 'Jean', last_name: 'Dupont', email: 'jean@school.fr' });

      expect(res.status).toBe(201);
      expect(res.body.first_name).toBe('Jean');
    });

    it('returns 400 when names are missing', async () => {
      const res = await request(app)
        .post('/api/students')
        .send({ email: 'jean@school.fr' });

      expect(res.status).toBe(400);
    });
  });

  // ── PUT /api/students/:id ─────────────────────────────
  describe('PUT /api/students/:id', () => {
    it('updates a student', async () => {
      pool.query.mockResolvedValue({
        rows: [{ id: 1, first_name: 'Jean', last_name: 'Martin' }],
      });

      const res = await request(app)
        .put('/api/students/1')
        .send({ last_name: 'Martin' });

      expect(res.status).toBe(200);
      expect(res.body.last_name).toBe('Martin');
    });

    it('returns 404 when student not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const res = await request(app)
        .put('/api/students/999')
        .send({ last_name: 'Unknown' });

      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /api/students/:id ──────────────────────────
  describe('DELETE /api/students/:id', () => {
    it('deletes and returns 204', async () => {
      pool.query.mockResolvedValue({ rowCount: 1 });

      const res = await request(app).delete('/api/students/1');
      expect(res.status).toBe(204);
    });

    it('returns 404 when student not found', async () => {
      pool.query.mockResolvedValue({ rowCount: 0 });

      const res = await request(app).delete('/api/students/999');
      expect(res.status).toBe(404);
    });
  });

  // ── POST /api/students/import ─────────────────────────
  describe('POST /api/students/import', () => {
    it('returns 400 when no file is uploaded', async () => {
      const res = await request(app).post('/api/students/import');
      expect(res.status).toBe(400);
    });

    it('imports students from a valid CSV (happy path)', async () => {
      // Class.findAll mock
      pool.query.mockResolvedValue({ rows: [{ id: 1, label: '3A', year: 2025 }] });

      // bulkCreate: mock connect → transaction
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [{ id: 1, first_name: 'Jean', last_name: 'Dupont' }] }) // INSERT
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      pool.connect.mockResolvedValue(mockClient);

      const csv = 'first_name,last_name,email,class_label,year\nJean,Dupont,jean@school.fr,3A,2025';

      const res = await request(app)
        .post('/api/students/import')
        .attach('file', Buffer.from(csv), { filename: 'students.csv', contentType: 'text/csv' });

      expect(res.status).toBe(201);
      expect(res.body.created).toBeGreaterThan(0);
    });

    it('returns errors for rows with missing names', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const mockClient = { query: jest.fn().mockResolvedValue({}), release: jest.fn() };
      pool.connect.mockResolvedValue(mockClient);

      // All rows have empty first_name
      const csv = 'first_name,last_name,email\n,Dupont,jean@school.fr\n,Curie,marie@school.fr';

      const res = await request(app)
        .post('/api/students/import')
        .attach('file', Buffer.from(csv), { filename: 'students.csv', contentType: 'text/csv' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });
});
