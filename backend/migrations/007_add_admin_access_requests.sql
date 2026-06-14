-- Add admin_until column to users and create admin_access_requests table

ALTER TABLE users
ADD COLUMN IF NOT EXISTS admin_until TIMESTAMP WITH TIME ZONE NULL;

CREATE TABLE IF NOT EXISTS admin_access_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_hours INTEGER,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  granted_until TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_requests_pending_user_idx
ON admin_access_requests(user_id)
WHERE status = 'pending';
