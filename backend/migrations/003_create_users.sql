CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(100) NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  role          VARCHAR(50) DEFAULT 'teacher',
  created_at    TIMESTAMP   DEFAULT NOW()
);
