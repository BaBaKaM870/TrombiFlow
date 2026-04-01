import os
import tempfile
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from src.main import app
from src.middlewares.auth import get_current_user

MOCK_USER = {"id": 1, "username": "testuser", "email": "test@school.fr"}
MOCK_STUDENTS = [
    {"id": 1, "first_name": "Jean", "last_name": "Dupont", "email": "jean@school.fr", "class_id": 1, "photo_url": None},
]


@pytest.fixture(autouse=True)
def override_auth():
    app.dependency_overrides[get_current_user] = lambda: MOCK_USER
    yield
    app.dependency_overrides.pop(get_current_user, None)


client = TestClient(app)


class TestTrombiHTML:
    def test_returns_200_and_html_document(self):
        with patch("src.routers.trombi.StudentModel.find_all") as mock_students, \
             patch("src.routers.trombi.ExportModel.create"):
            mock_students.return_value = MOCK_STUDENTS
            res = client.get("/api/trombi/?format=html")
        assert res.status_code == 200
        assert "text/html" in res.headers["content-type"]
        assert "Trombinoscope" in res.text
        assert "Jean" in res.text
        assert "RGPD" in res.text

    def test_includes_class_label_when_class_id_provided(self):
        with patch("src.routers.trombi.StudentModel.find_all") as mock_students, \
             patch("src.routers.trombi.ClassModel.find_by_id") as mock_class, \
             patch("src.routers.trombi.ExportModel.create"):
            mock_students.return_value = MOCK_STUDENTS
            mock_class.return_value = {"id": 1, "label": "3A"}
            res = client.get("/api/trombi/?format=html&class_id=1")
        assert res.status_code == 200
        assert "3A" in res.text

    def test_returns_404_when_no_students_found(self):
        with patch("src.routers.trombi.StudentModel.find_all") as mock_students:
            mock_students.return_value = []
            res = client.get("/api/trombi/?format=html")
        assert res.status_code == 404

    def test_returns_400_for_unsupported_format(self):
        res = client.get("/api/trombi/?format=docx")
        assert res.status_code == 400


class TestTrombiPDF:
    def test_returns_pdf_file(self):
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            f.write(b"%PDF-1.4\n%%EOF\n")
            fake_pdf_path = f.name
        try:
            with patch("src.routers.trombi.StudentModel.find_all") as mock_students, \
                 patch("src.routers.trombi.generate_pdf") as mock_pdf, \
                 patch("src.routers.trombi.ExportModel.create"):
                mock_students.return_value = MOCK_STUDENTS
                mock_pdf.return_value = fake_pdf_path
                res = client.get("/api/trombi/?format=pdf")
            assert res.status_code == 200
            assert "application/pdf" in res.headers["content-type"]
            assert len(res.content) > 0
        finally:
            if os.path.exists(fake_pdf_path):
                os.unlink(fake_pdf_path)
