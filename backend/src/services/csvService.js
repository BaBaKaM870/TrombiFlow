const { parse } = require('csv-parse');
const Class = require('../models/Class');

/**
 * Parse a CSV Buffer and return an array of plain objects.
 * Expects headers: first_name, last_name, email, class_label, year, photo_url
 */
function parseCsv(buffer) {
  return new Promise((resolve, reject) => {
    parse(buffer, { columns: true, skip_empty_lines: true, trim: true }, (err, records) => {
      if (err) return reject(err);
      resolve(records);
    });
  });
}

/**
 * Validate records and resolve class IDs.
 * Returns { students: [...], errors: [...] }
 */
async function processCsvRecords(records) {
  const students = [];
  const errors = [];

  // Cache classes to avoid repeated DB queries
  let classCache = null;
  const getClasses = async () => {
    if (!classCache) classCache = await Class.findAll();
    return classCache;
  };

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    const rowNum = i + 2; // row 1 = header

    if (!rec.first_name || !rec.last_name) {
      errors.push({ row: rowNum, error: 'first_name and last_name are required' });
      continue;
    }

    let class_id = null;
    if (rec.class_label) {
      const classes = await getClasses();
      const existing = classes.find((c) => c.label === rec.class_label);
      if (existing) {
        class_id = existing.id;
      } else {
        try {
          const created = await Class.create({ label: rec.class_label, year: rec.year || null });
          class_id = created.id;
          classCache = null; // invalidate cache
        } catch (err) {
          errors.push({ row: rowNum, error: `Could not create class "${rec.class_label}": ${err.message}` });
        }
      }
    }

    students.push({
      first_name: rec.first_name,
      last_name: rec.last_name,
      email: rec.email || null,
      class_id,
      photo_url: rec.photo_url || null,
    });
  }

  return { students, errors };
}

module.exports = { parseCsv, processCsvRecords };
