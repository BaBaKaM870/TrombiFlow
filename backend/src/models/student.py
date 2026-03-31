from ..config.database import query, query_one, get_conn
from psycopg2.extras import RealDictCursor


class StudentModel:
    @staticmethod
    def find_all(class_id=None, q=None) -> list[dict]:
        sql = """
            SELECT s.*, c.label AS class_label
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE 1=1
        """
        params: list = []
        if class_id:
            sql += " AND s.class_id = %s"
            params.append(class_id)
        if q:
            sql += " AND (s.first_name ILIKE %s OR s.last_name ILIKE %s)"
            params.extend([f"%{q}%", f"%{q}%"])
        sql += " ORDER BY s.last_name, s.first_name"
        return query(sql, params or None)

    @staticmethod
    def find_by_id(id: int) -> dict | None:
        return query_one(
            """
            SELECT s.*, c.label AS class_label
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE s.id = %s
            """,
            (id,),
        )

    @staticmethod
    def create(
        first_name: str,
        last_name: str,
        email=None,
        class_id=None,
        photo_url=None,
    ) -> dict:
        return query_one(
            """
            INSERT INTO students (first_name, last_name, email, class_id, photo_url)
            VALUES (%s, %s, %s, %s, %s) RETURNING *
            """,
            (first_name, last_name, email, class_id, photo_url),
        )

    @staticmethod
    def update(id: int, fields: dict) -> dict | None:
        allowed = ["first_name", "last_name", "email", "class_id", "photo_url"]
        updates, values = [], []
        for key in allowed:
            if key in fields:
                updates.append(f"{key} = %s")
                values.append(fields[key])
        if not updates:
            return None
        values.append(id)
        return query_one(
            f"UPDATE students SET {', '.join(updates)} WHERE id = %s RETURNING *",
            values,
        )

    @staticmethod
    def update_photo(id: int, photo_url: str) -> dict | None:
        return query_one(
            "UPDATE students SET photo_url = %s WHERE id = %s RETURNING *",
            (photo_url, id),
        )

    @staticmethod
    def delete(id: int) -> bool:
        rows = query("DELETE FROM students WHERE id = %s RETURNING id", (id,))
        return len(rows) > 0

    @staticmethod
    def bulk_create(students: list[dict]) -> list[dict]:
        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                created = []
                for s in students:
                    cur.execute(
                        """
                        INSERT INTO students (first_name, last_name, email, class_id, photo_url)
                        VALUES (%s, %s, %s, %s, %s) RETURNING *
                        """,
                        (
                            s["first_name"],
                            s["last_name"],
                            s.get("email"),
                            s.get("class_id"),
                            s.get("photo_url"),
                        ),
                    )
                    created.append(dict(cur.fetchone()))
                return created
