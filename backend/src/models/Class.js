const pool = require('../config/database');

const Class = {
  async findAll() {
    const { rows } = await pool.query('SELECT * FROM classes ORDER BY label');
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM classes WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async create({ label, year }) {
    const { rows } = await pool.query(
      'INSERT INTO classes (label, year) VALUES ($1, $2) RETURNING *',
      [label, year || null]
    );
    return rows[0];
  },

  async update(id, fields) {
    const updates = [];
    const values = [];

    if (fields.label !== undefined) {
      values.push(fields.label);
      updates.push(`label = $${values.length}`);
    }
    if (fields.year !== undefined) {
      values.push(fields.year);
      updates.push(`year = $${values.length}`);
    }

    if (updates.length === 0) return null;

    values.push(id);
    const { rows } = await pool.query(
      `UPDATE classes SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    return rows[0] || null;
  },

  async delete(id) {
    const { rowCount } = await pool.query('DELETE FROM classes WHERE id = $1', [id]);
    return rowCount > 0;
  },
};

module.exports = Class;
