CREATE TABLE IF NOT EXISTS exports (
  id            SERIAL PRIMARY KEY,
  class_id      INTEGER REFERENCES classes(id) ON DELETE SET NULL,
  format        VARCHAR(10) NOT NULL CHECK (format IN ('html', 'pdf')),
  file_path     TEXT,
  generated_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exports_created_at ON exports(created_at DESC);
