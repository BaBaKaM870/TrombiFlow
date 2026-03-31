const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  connect: jest.fn(),
  on: jest.fn(),
}));

// We mock pdfService so tests don't need a real PDF renderer
// Note: jest.mock factories are hoisted, so use require() instead of top-level variables
jest.mock('../src/services/pdfService', () => ({
  generatePDF: jest.fn().mockResolvedValue(
    require('path').join(require('os').tmpdir(), 'trombi-test.pdf')
  ),
}));

const FAKE_PDF = path.join(os.tmpdir(), 'trombi-test.pdf');

const app = require('../src/app');
const pool = require('../src/config/database');

const MOCK_STUDENTS = [
  { id: 1, first_name: 'Jean', last_name: 'Dupont', email: 'jean@school.fr', class_id: 1, photo_url: null },
];

beforeAll(() => {
  // Create a fake PDF file for streaming tests
  fs.writeFileSync(FAKE_PDF, '%PDF-1.4\n%%EOF\n');
});

afterAll(() => {
  if (fs.existsSync(FAKE_PDF)) fs.unlinkSync(FAKE_PDF);
});

describe('Trombi API', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── HTML format ───────────────────────────────────────
  describe('GET /api/trombi?format=html', () => {
    it('returns status 200 and an HTML document', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: MOCK_STUDENTS }) // Student.findAll
        .mockResolvedValueOnce({ rows: [{ id: 1 }] });  // Export.create

      const res = await request(app).get('/api/trombi?format=html');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
      expect(res.text).toContain('Trombinoscope');
      expect(res.text).toContain('Jean');
      expect(res.text).toContain('RGPD');
    });

    it('includes class label when class_id is provided', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: MOCK_STUDENTS })               // Student.findAll
        .mockResolvedValueOnce({ rows: [{ id: 1, label: '3A' }] })   // Class.findById
        .mockResolvedValueOnce({ rows: [{ id: 1 }] });                // Export.create

      const res = await request(app).get('/api/trombi?format=html&class_id=1');
      expect(res.status).toBe(200);
      expect(res.text).toContain('3A');
    });

    it('returns 404 when no students are found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const res = await request(app).get('/api/trombi?format=html');
      expect(res.status).toBe(404);
    });

    it('returns 400 for unsupported format', async () => {
      const res = await request(app).get('/api/trombi?format=docx');
      expect(res.status).toBe(400);
    });
  });

  // ── PDF format ────────────────────────────────────────
  describe('GET /api/trombi?format=pdf', () => {
    it('returns a non-empty PDF file', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: MOCK_STUDENTS }) // Student.findAll
        .mockResolvedValueOnce({ rows: [{ id: 1 }] });  // Export.create

      const res = await request(app)
        .get('/api/trombi?format=pdf')
        .buffer(true)
        .parse((res, callback) => {
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => callback(null, Buffer.concat(chunks)));
        });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/pdf/);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });
});
