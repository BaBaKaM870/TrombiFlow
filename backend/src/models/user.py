from ..config.database import query, query_one


class UserModel:
    @staticmethod
    def find_by_email(email: str) -> dict | None:
        return query_one("SELECT * FROM users WHERE email = %s", (email,))

    @staticmethod
    def find_by_id(id: int) -> dict | None:
        return query_one(
            "SELECT id, username, email, role, photo_url, created_at FROM users WHERE id = %s",
            (id,),
        )

    @staticmethod
    def create(
        username: str,
        email: str,
        password_hash: str,
        role: str = "teacher",
        photo_url: str | None = None,
    ) -> dict:
        return query_one(
            """
            INSERT INTO users (username, email, password_hash, role, photo_url)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, username, email, role, photo_url, created_at
            """,
            (username, email, password_hash, role, photo_url),
        )
