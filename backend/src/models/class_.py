from ..config.database import query, query_one


class ClassModel:
    @staticmethod
    def find_all() -> list[dict]:
        return query("SELECT * FROM classes ORDER BY label")

    @staticmethod
    def find_by_id(id: int) -> dict | None:
        return query_one("SELECT * FROM classes WHERE id = %s", (id,))

    @staticmethod
    def create(label: str, year: int | None = None) -> dict:
        return query_one(
            "INSERT INTO classes (label, year) VALUES (%s, %s) RETURNING *",
            (label, year),
        )

    @staticmethod
    def update(id: int, fields: dict) -> dict | None:
        updates, values = [], []
        if "label" in fields:
            updates.append("label = %s")
            values.append(fields["label"])
        if "year" in fields:
            updates.append("year = %s")
            values.append(fields["year"])
        if not updates:
            return None
        values.append(id)
        return query_one(
            f"UPDATE classes SET {', '.join(updates)} WHERE id = %s RETURNING *",
            values,
        )

    @staticmethod
    def delete(id: int) -> bool:
        rows = query("DELETE FROM classes WHERE id = %s RETURNING id", (id,))
        return len(rows) > 0
