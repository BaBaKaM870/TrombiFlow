from ..config.database import query_one, query
from typing import Optional


class UserModel:
    _BASE_COLUMNS = "id, username, email, role, photo_url, created_at"

    @staticmethod
    def _has_admin_until_column() -> bool:
        try:
            res = query_one(
                "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'admin_until'",
            )
            return bool(res)
        except Exception:
            return False

    @staticmethod
    def _public_columns() -> str:
        if UserModel._has_admin_until_column():
            return "id, username, email, role, photo_url, admin_until, created_at"
        return UserModel._BASE_COLUMNS

    @staticmethod
    def find_by_email(email: str) -> Optional[dict]:
        return query_one("SELECT * FROM users WHERE email = %s", (email,))

    @staticmethod
    def find_by_id(id: int) -> Optional[dict]:
        cols = UserModel._public_columns()
        return query_one(f"SELECT {cols} FROM users WHERE id = %s", (id,))

    @staticmethod
    def find_all() -> list[dict]:
        cols = UserModel._public_columns()
        return query(f"SELECT {cols} FROM users ORDER BY created_at DESC, id DESC")

    @staticmethod
    def create(
        username: str,
        email: str,
        password_hash: str,
        role: str = "teacher",
        photo_url: Optional[str] = None,
    ) -> Optional[dict]:
        # Insert and return the freshly created user using a safe pattern
        inserted = query_one(
            "INSERT INTO users (username, email, password_hash, role, photo_url) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (username, email, password_hash, role, photo_url),
        )
        if not inserted:
            return None
        return UserModel.find_by_id(inserted["id"])

    @staticmethod
    def update(id: int, fields: dict) -> Optional[dict]:
        allowed = ["username", "email", "password_hash", "role"]
        if UserModel._has_admin_until_column():
            allowed.append("admin_until")

        updates, values = [], []
        for key in allowed:
            if key in fields:
                updates.append(f"{key} = %s")
                values.append(fields[key])
        if not updates:
            return UserModel.find_by_id(id)

        values.append(id)
        query_one(
            f"UPDATE users SET {', '.join(updates)} WHERE id = %s RETURNING id",
            values,
        )
        return UserModel.find_by_id(id)

    @staticmethod
    def update_photo(id: int, photo_url: str) -> Optional[dict]:
        query_one(
            "UPDATE users SET photo_url = %s WHERE id = %s RETURNING id",
            (photo_url, id),
        )
        return UserModel.find_by_id(id)

    @staticmethod
    def delete(id: int) -> bool:
        deleted = query_one("DELETE FROM users WHERE id = %s RETURNING id", (id,))
        return deleted is not None
