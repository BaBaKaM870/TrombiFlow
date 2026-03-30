const pool = require('../config/database');

const Student = {
  async findAll({ class_id, q } = {}) {
    let query = `
      SELECT s.*, c.label AS class_label
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (class_id) {
      params.push(class_id);
      query += ` AND s.class_id = $${params.length}`;
    }
    if (q) {
      params.push(`%${q}%`);
      query += ` AND (s.first_name ILIKE $${params.length} OR s.last_name ILIKE $${params.length})`;
    }
    query += ' ORDER BY s.last_name, s.first_name';

    const { rows } = await pool.query(query, params);
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT s.*, c.label AS class_label
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE s.id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async create({ first_name, last_name, email, class_id, photo_url }) {
    const { rows } = await pool.query(
      `INSERT INTO students (first_name, last_name, email, class_id, photo_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [first_name, last_name, email || null, class_id || null, photo_url || null]
    );
    return rows[0];
  },

  async update(id, fields) {
    const allowed = ['first_name', 'last_name', 'email', 'class_id', 'photo_url'];
    const updates = [];
    const values = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        values.push(fields[key]);
        updates.push(`${key} = $${values.length}`);
      }
    }

    if (updates.length === 0) return null;

    values.push(id);
    const { rows } = await pool.query(
      `UPDATE students SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    return rows[0] || null;
  },

  async updatePhoto(id, photo_url) {
    const { rows } = await pool.query(
      'UPDATE students SET photo_url = $1 WHERE id = $2 RETURNING *',
      [photo_url, id]
    );
    return rows[0] || null;
  },

  async delete(id) {
    const { rowCount } = await pool.query('DELETE FROM students WHERE id = $1', [id]);
    return rowCount > 0;
  },

  async bulkCreate(students) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const created = [];
      for (const s of students) {
        const { rows } = await client.query(
          `INSERT INTO students (first_name, last_name, email, class_id, photo_url)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [s.first_name, s.last_name, s.email || null, s.class_id || null, s.photo_url || null]
        );
        created.push(rows[0]);
      }
      await client.query('COMMIT');
      return created;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};

module.exports = Student;
