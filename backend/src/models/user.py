from ..config.database import query_one


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

    @staticmethod
    def update(id: int, fields: dict) -> dict | None:
        allowed = ["username", "email", "password_hash"]
        updates, values = [], []
        for key in allowed:
            if key in fields:
                updates.append(f"{key} = %s")
                values.append(fields[key])
        if not updates:
            return UserModel.find_by_id(id)

        values.append(id)
        return query_one(
            f"""
            UPDATE users
            SET {', '.join(updates)}
            WHERE id = %s
            RETURNING id, username, email, role, photo_url, created_at
            """,
            values,
        )

    @staticmethod
    def update_photo(id: int, photo_url: str) -> dict | None:
        return query_one(
            """
            UPDATE users
            SET photo_url = %s
            WHERE id = %s
            RETURNING id, username, email, role, photo_url, created_at
            """,
            (photo_url, id),
        )
