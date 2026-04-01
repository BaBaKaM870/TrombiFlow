CREATE TABLE IF NOT EXISTS students (
  id         SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name  VARCHAR(100) NOT NULL,
  email      VARCHAR(255),
  class_id   INTEGER REFERENCES classes(id) ON DELETE SET NULL,
  photo_url  TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
