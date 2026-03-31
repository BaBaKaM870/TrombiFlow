from unittest.mock import patch
from fastapi.testclient import TestClient

from src.main import app

client = TestClient(app)


class TestGetStudents:
    def test_returns_all_students(self):
        with patch("src.routers.students.StudentModel.find_all") as mock:
            mock.return_value = [{"id": 1, "first_name": "Jean", "last_name": "Dupont", "class_id": 1}]
            res = client.get("/api/students/")
        assert res.status_code == 200
        assert len(res.json()) == 1

    def test_filters_by_class_id(self):
        with patch("src.routers.students.StudentModel.find_all") as mock:
            mock.return_value = []
            res = client.get("/api/students/?class_id=2")
        assert res.status_code == 200
        assert res.json() == []

    def test_filters_by_search_query(self):
        with patch("src.routers.students.StudentModel.find_all") as mock:
            mock.return_value = [{"id": 2, "first_name": "Marie", "last_name": "Curie", "class_id": 1}]
            res = client.get("/api/students/?q=Marie")
        assert res.status_code == 200
        assert res.json()[0]["first_name"] == "Marie"


class TestPostStudents:
    def test_creates_student_and_returns_201(self):
        with patch("src.routers.students.StudentModel.create") as mock:
            mock.return_value = {"id": 1, "first_name": "Jean", "last_name": "Dupont", "email": "jean@school.fr"}
            res = client.post("/api/students/", json={"first_name": "Jean", "last_name": "Dupont", "email": "jean@school.fr"})
        assert res.status_code == 201
        assert res.json()["first_name"] == "Jean"

    def test_returns_422_when_names_are_missing(self):
        res = client.post("/api/students/", json={"email": "jean@school.fr"})
        assert res.status_code == 422


class TestPutStudents:
    def test_updates_a_student(self):
        with patch("src.routers.students.StudentModel.update") as mock:
            mock.return_value = {"id": 1, "first_name": "Jean", "last_name": "Martin"}
            res = client.put("/api/students/1", json={"last_name": "Martin"})
        assert res.status_code == 200
        assert res.json()["last_name"] == "Martin"

    def test_returns_404_when_student_not_found(self):
        with patch("src.routers.students.StudentModel.update") as mock:
            mock.return_value = None
            res = client.put("/api/students/999", json={"last_name": "Unknown"})
        assert res.status_code == 404


class TestDeleteStudents:
    def test_deletes_and_returns_204(self):
        with patch("src.routers.students.StudentModel.delete") as mock:
            mock.return_value = True
            res = client.delete("/api/students/1")
        assert res.status_code == 204

    def test_returns_404_when_student_not_found(self):
        with patch("src.routers.students.StudentModel.delete") as mock:
            mock.return_value = False
            res = client.delete("/api/students/999")
        assert res.status_code == 404


class TestImportStudents:
    def test_returns_422_when_no_file_uploaded(self):
        res = client.post("/api/students/import")
        assert res.status_code == 422

    def test_imports_students_from_valid_csv(self):
        csv_content = b"first_name,last_name,email,class_label,year\nJean,Dupont,jean@school.fr,3A,2025"
        with patch("src.services.csv_service.ClassModel.find_all") as mock_classes, \
             patch("src.routers.students.StudentModel.bulk_create") as mock_create:
            mock_classes.return_value = [{"id": 1, "label": "3A", "year": 2025}]
            mock_create.return_value = [{"id": 1, "first_name": "Jean", "last_name": "Dupont"}]
            res = client.post(
                "/api/students/import",
                files={"file": ("students.csv", csv_content, "text/csv")},
            )
        assert res.status_code == 201
        assert res.json()["created"] >= 1

    def test_returns_errors_for_rows_with_missing_names(self):
        csv_content = b"first_name,last_name,email\n,Dupont,jean@school.fr\n,Curie,marie@school.fr"
        res = client.post(
            "/api/students/import",
            files={"file": ("students.csv", csv_content, "text/csv")},
        )
        assert res.status_code == 400
        assert "errors" in res.json()
