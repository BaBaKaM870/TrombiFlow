const pool = require('../config/database');

const Export = {
  async create({ class_id, format, file_path, generated_by }) {
    const { rows } = await pool.query(
      `INSERT INTO exports (class_id, format, file_path, generated_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [class_id || null, format, file_path || null, generated_by || null]
    );
    return rows[0];
  },

  async findAll() {
    const { rows } = await pool.query(`
      SELECT
        e.*,
        c.label AS class_label,
        u.username AS generated_by_name
      FROM exports e
      LEFT JOIN classes c ON e.class_id = c.id
      LEFT JOIN users   u ON e.generated_by = u.id
      ORDER BY e.created_at DESC
    `);
    return rows;
  },
};

module.exports = Export;
