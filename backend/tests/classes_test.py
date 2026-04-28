from unittest.mock import patch
from fastapi.testclient import TestClient
from psycopg2 import errors as pg_errors

from src.main import app

client = TestClient(app)


class TestGetClasses:
    def test_returns_list_of_classes(self):
        with patch("src.routers.classes.ClassModel.find_all") as mock:
            mock.return_value = [{"id": 1, "label": "3A", "year": "2025-2026"}]
            res = client.get("/api/classes/")
        assert res.status_code == 200
        assert len(res.json()) == 1
        assert res.json()[0]["label"] == "3A"

    def test_returns_empty_array_when_no_classes(self):
        with patch("src.routers.classes.ClassModel.find_all") as mock:
            mock.return_value = []
            res = client.get("/api/classes/")
        assert res.status_code == 200
        assert res.json() == []


class TestPostClasses:
    def test_creates_class_and_returns_201(self):
        with patch("src.routers.classes.ClassModel.create") as mock:
            mock.return_value = {"id": 1, "label": "3B", "year": "2025-2026"}
            res = client.post("/api/classes/", json={"label": "3B", "year": "2025-2026"})
        assert res.status_code == 201
        assert res.json()["label"] == "3B"

    def test_returns_422_when_label_is_missing(self):
        res = client.post("/api/classes/", json={"year": "2025-2026"})
        assert res.status_code == 422

    def test_returns_409_on_duplicate_label(self):
        with patch("src.routers.classes.ClassModel.create") as mock:
            mock.side_effect = pg_errors.UniqueViolation("UNIQUE violation")
            res = client.post("/api/classes/", json={"label": "3B"})
        assert res.status_code == 409


class TestPutClasses:
    def test_updates_and_returns_class(self):
        with patch("src.routers.classes.ClassModel.update") as mock:
            mock.return_value = {"id": 1, "label": "3C", "year": "2025-2026"}
            res = client.put("/api/classes/1", json={"label": "3C", "year": "2025-2026"})
        assert res.status_code == 200
        assert res.json()["label"] == "3C"

    def test_returns_404_when_class_not_found(self):
        with patch("src.routers.classes.ClassModel.update") as mock:
            mock.return_value = None
            res = client.put("/api/classes/999", json={"label": "3C"})
        assert res.status_code == 404


class TestDeleteClasses:
    def test_deletes_and_returns_204(self):
        with patch("src.routers.classes.ClassModel.delete") as mock:
            mock.return_value = True
            res = client.delete("/api/classes/1")
        assert res.status_code == 204

    def test_returns_404_when_class_not_found(self):
        with patch("src.routers.classes.ClassModel.delete") as mock:
            mock.return_value = False
            res = client.delete("/api/classes/999")
        assert res.status_code == 404
