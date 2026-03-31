CREATE TABLE IF NOT EXISTS exports (
  id           SERIAL PRIMARY KEY,
  class_id     INTEGER REFERENCES classes(id) ON DELETE SET NULL,
  format       VARCHAR(10) NOT NULL,
  file_path    TEXT,
  generated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMP DEFAULT NOW()
);
