from ..config.database import query, query_one


class ExportModel:
    @staticmethod
    def create(
        class_id=None,
        format: str = "html",
        file_path=None,
        generated_by=None,
    ) -> dict:
        return query_one(
            """
            INSERT INTO exports (class_id, format, file_path, generated_by)
            VALUES (%s, %s, %s, %s) RETURNING *
            """,
            (class_id, format, file_path, generated_by),
        )

    @staticmethod
    def find_all() -> list[dict]:
        return query("""
            SELECT
              e.*,
              c.label AS class_label,
              u.username AS generated_by_name,
              u.email AS generated_by_email,
              u.role AS generated_by_role
            FROM exports e
            LEFT JOIN classes c ON e.class_id = c.id
            LEFT JOIN users   u ON e.generated_by = u.id
            ORDER BY e.created_at DESC
            """)

    @staticmethod
    def find_by_user(user_id: int) -> list[dict]:
        return query(
            """
            SELECT
              e.*,
              c.label AS class_label,
              u.username AS generated_by_name,
              u.email AS generated_by_email,
              u.role AS generated_by_role
            FROM exports e
            LEFT JOIN classes c ON e.class_id = c.id
            LEFT JOIN users   u ON e.generated_by = u.id
            WHERE e.generated_by = %s
            ORDER BY e.created_at DESC
            """,
            (user_id,),
        )

    @staticmethod
    def find_by_id(id: int) -> dict | None:
        return query_one(
            """
            SELECT
              e.*,
              c.label AS class_label,
              u.username AS generated_by_name,
              u.email AS generated_by_email,
              u.role AS generated_by_role
            FROM exports e
            LEFT JOIN classes c ON e.class_id = c.id
            LEFT JOIN users   u ON e.generated_by = u.id
            WHERE e.id = %s
            """,
            (id,),
        )

    @staticmethod
    def delete(id: int) -> bool:
        deleted = query_one("DELETE FROM exports WHERE id = %s RETURNING id", (id,))
        return deleted is not None
