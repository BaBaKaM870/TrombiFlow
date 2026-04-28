import csv
import io

from ..models.class_ import ClassModel


def parse_csv(content: bytes) -> list[dict]:
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    return [row for row in reader]


def process_csv_records(records: list[dict]):
    students: list[dict] = []
    errors: list[dict] = []
    class_cache: list[dict] | None = None

    def get_classes() -> list[dict]:
        nonlocal class_cache
        if class_cache is None:
            class_cache = ClassModel.find_all()
        return class_cache

    for i, rec in enumerate(records):
        row_num = i + 2
        first_name = (rec.get("first_name") or "").strip()
        last_name = (rec.get("last_name") or "").strip()

        if not first_name or not last_name:
            errors.append({"row": row_num, "error": "first_name and last_name are required"})
            continue

        class_id = None
        class_label = (rec.get("class_label") or "").strip()
        if class_label:
            classes = get_classes()
            existing = next((c for c in classes if c["label"] == class_label), None)
            if existing:
                class_id = existing["id"]
            else:
                try:
                    year_value = (rec.get("year") or "").strip() or None
                    created = ClassModel.create(
                        label=class_label,
                        year=year_value,
                    )
                    class_id = created["id"]
                    class_cache = None
                except Exception as e:
                    errors.append(
                        {"row": row_num, "error": f'Could not create class "{class_label}": {e}'}
                    )

        students.append(
            {
                "first_name": first_name,
                "last_name": last_name,
                "email": rec.get("email") or None,
                "class_id": class_id,
                "photo_url": rec.get("photo_url") or None,
            }
        )

    return students, errors
