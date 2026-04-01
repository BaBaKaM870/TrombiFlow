CREATE TABLE IF NOT EXISTS classes (
  id         SERIAL PRIMARY KEY,
  label      VARCHAR(100) NOT NULL UNIQUE,
  year       INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
