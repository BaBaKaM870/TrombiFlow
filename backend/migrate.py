#!/usr/bin/env python3
"""Apply pending SQL migrations to the configured PostgreSQL database.

Migrations are read from the ``migrations/`` directory (relative to this
script) and applied in alphabetical order.  A ``_migrations`` table is
created on first run to track which files have already been applied, so the
script is safe to run on every container start.
"""
import glob
import os

import psycopg2


def run() -> None:
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        raise RuntimeError("DATABASE_URL environment variable is not set")

    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    cur = conn.cursor()

    # Ensure the tracking table exists.
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS _migrations (
            filename   TEXT        PRIMARY KEY,
            applied_at TIMESTAMPTZ DEFAULT now()
        )
        """
    )

    migrations_dir = os.path.join(os.path.dirname(__file__), "migrations")
    sql_files = sorted(glob.glob(os.path.join(migrations_dir, "*.sql")))

    if not sql_files:
        print("[migrate] no SQL files found in migrations/")
    else:
        for path in sql_files:
            name = os.path.basename(path)
            cur.execute("SELECT 1 FROM _migrations WHERE filename = %s", (name,))
            if cur.fetchone():
                print(f"[migrate] skip  {name}")
                continue
            print(f"[migrate] apply {name} ...", end=" ", flush=True)
            with open(path) as fh:
                cur.execute(fh.read())
            cur.execute("INSERT INTO _migrations (filename) VALUES (%s)", (name,))
            print("ok")

    cur.close()
    conn.close()
    print("[migrate] done")


if __name__ == "__main__":
    run()
