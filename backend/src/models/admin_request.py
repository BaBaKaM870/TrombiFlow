from ..config.database import query, query_one
from datetime import datetime, timezone, timedelta


class AdminRequestModel:
    @staticmethod
    def _ensure_table():
        try:
            exists = query_one(
                "SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_access_requests'"
            )
            if exists:
                return
            query("""
                CREATE TABLE IF NOT EXISTS admin_access_requests (
                  id SERIAL PRIMARY KEY,
                  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                  status VARCHAR(20) NOT NULL DEFAULT 'pending',
                  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                  duration_hours INTEGER,
                  reviewed_by INTEGER REFERENCES users(id),
                  reviewed_at TIMESTAMP WITH TIME ZONE,
                  granted_until TIMESTAMP WITH TIME ZONE
                )
                """)
            query("""
                CREATE UNIQUE INDEX IF NOT EXISTS admin_requests_pending_user_idx
                  ON admin_access_requests(user_id)
                  WHERE status = 'pending'
                """)
            if not query_one("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'users' AND column_name = 'admin_until'
                """):
                query(
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_until TIMESTAMP WITH TIME ZONE NULL"
                )
        except Exception:
            pass

    @staticmethod
    def create(user_id: int) -> dict:
        AdminRequestModel._ensure_table()
        return query_one(
            """
            INSERT INTO admin_access_requests (user_id)
            VALUES (%s)
            RETURNING id, user_id, status, requested_at, duration_hours, reviewed_by, reviewed_at, granted_until
            """,
            (user_id,),
        )

    @staticmethod
    def find_by_id(id: int) -> dict | None:
        AdminRequestModel._ensure_table()
        return query_one(
            "SELECT id, user_id, status, requested_at, duration_hours, reviewed_by, reviewed_at, granted_until FROM admin_access_requests WHERE id = %s",
            (id,),
        )

    @staticmethod
    def find_pending_for_user(user_id: int) -> dict | None:
        AdminRequestModel._ensure_table()
        return query_one(
            "SELECT id, user_id, status, requested_at, duration_hours, reviewed_by, reviewed_at, granted_until FROM admin_access_requests WHERE user_id = %s AND status = 'pending' ORDER BY requested_at DESC LIMIT 1",
            (user_id,),
        )

    @staticmethod
    def list_pending() -> list[dict]:
        AdminRequestModel._ensure_table()
        return query(
            "SELECT ar.id, ar.user_id, ar.status, ar.requested_at, ar.duration_hours, ar.reviewed_by, ar.reviewed_at, ar.granted_until, u.username, u.email FROM admin_access_requests ar JOIN users u ON u.id = ar.user_id WHERE ar.status = 'pending' ORDER BY ar.requested_at ASC"
        )

    @staticmethod
    def approve(request_id: int, reviewer_id: int, duration_hours: int) -> dict | None:
        # compute granted_until
        now = datetime.now(timezone.utc)
        granted_until = now + timedelta(hours=duration_hours)

        AdminRequestModel._ensure_table()
        updated = query_one(
            """
            UPDATE admin_access_requests
            SET status = 'approved', duration_hours = %s, reviewed_by = %s, reviewed_at = %s, granted_until = %s
            WHERE id = %s
            RETURNING id, user_id, status, requested_at, duration_hours, reviewed_by, reviewed_at, granted_until
            """,
            (duration_hours, reviewer_id, now, granted_until, request_id),
        )

        if updated:
            # try to set admin_until on users if column exists, otherwise only set role
            try:
                # attempt to set admin_until; if column doesn't exist this will raise
                query_one(
                    "UPDATE users SET role = 'admin', admin_until = %s WHERE id = (SELECT user_id FROM admin_access_requests WHERE id = %s) RETURNING id",
                    (granted_until, request_id),
                )
            except Exception:
                # fallback: set only role
                try:
                    query_one(
                        "UPDATE users SET role = 'admin' WHERE id = (SELECT user_id FROM admin_access_requests WHERE id = %s) RETURNING id",
                        (request_id,),
                    )
                except Exception:
                    pass

        return updated

    @staticmethod
    def reject(request_id: int, reviewer_id: int) -> dict | None:
        now = datetime.now(timezone.utc)
        AdminRequestModel._ensure_table()
        updated = query_one(
            """
            UPDATE admin_access_requests
            SET status = 'rejected', reviewed_by = %s, reviewed_at = %s
            WHERE id = %s
            RETURNING id, user_id, status, requested_at, duration_hours, reviewed_by, reviewed_at, granted_until
            """,
            (reviewer_id, now, request_id),
        )
        return updated
