const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  connect: jest.fn(),
  on: jest.fn(),
}));

// Mock imageService: simply return the input path unchanged (no actual resize)
jest.mock('../src/services/imageService', () => ({
  resizePhoto: jest.fn().mockImplementation((inputPath) => Promise.resolve(inputPath)),
}));

const app = require('../src/app');
const pool = require('../src/config/database');

// Minimal 1×1 white JPEG (from a known-good tiny JPEG buffer)
const TINY_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U' +
  'HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARAQABAAEDASIA' +
  'AhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/' +
  'xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQ' +
  'MRADwAKwAB/9k=',
  'base64'
);

describe('Photo upload', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when no file is provided', async () => {
    const res = await request(app).post('/api/students/1/photo');
    expect(res.status).toBe(400);
  });

  it('returns 404 when student does not exist', async () => {
    pool.query.mockResolvedValue({ rows: [] }); // Student.findById returns nothing

    const res = await request(app)
      .post('/api/students/999/photo')
      .attach('photo', TINY_JPEG, { filename: 'test.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(404);
  });

  it('resizes the photo and updates the student', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1, first_name: 'Jean', last_name: 'Dupont' }] }) // findById
      .mockResolvedValueOnce({
        rows: [{ id: 1, first_name: 'Jean', last_name: 'Dupont', photo_url: 'uploads/photo.jpg' }],
      }); // updatePhoto

    const res = await request(app)
      .post('/api/students/1/photo')
      .attach('photo', TINY_JPEG, { filename: 'test.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(res.body.photo_url).toBeDefined();

    const { resizePhoto } = require('../src/services/imageService');
    expect(resizePhoto).toHaveBeenCalled();
  });

  it('rejects files that are not images', async () => {
    const res = await request(app)
      .post('/api/students/1/photo')
      .attach('photo', Buffer.from('not an image'), {
        filename: 'evil.pdf',
        contentType: 'application/pdf',
      });

    // Multer rejects non-images with 415 or 500 depending on the error
    expect([400, 415, 500]).toContain(res.status);
  });
});
