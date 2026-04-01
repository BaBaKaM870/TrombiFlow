import os
import psycopg2
from psycopg2.pool import ThreadedConnectionPool
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager

_pool: ThreadedConnectionPool | None = None


def _get_pool() -> ThreadedConnectionPool:
    global _pool
    if _pool is None:
        dsn = os.environ.get("DATABASE_URL")
        ssl_opts = (
            {"sslmode": "require"}
            if os.environ.get("ENV") == "production"
            else {}
        )
        _pool = ThreadedConnectionPool(
            1, 10, dsn, cursor_factory=RealDictCursor, **ssl_opts
        )
    return _pool


@contextmanager
def get_conn():
    pool = _get_pool()
    conn = pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)


def query(sql: str, params=None) -> list[dict]:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            try:
                return [dict(r) for r in cur.fetchall()]
            except psycopg2.ProgrammingError:
                return []


def query_one(sql: str, params=None) -> dict | None:
    rows = query(sql, params)
    return rows[0] if rows else None
