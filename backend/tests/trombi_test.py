import os
import tempfile
import pytest
from pathlib import Path
from unittest.mock import patch
from fastapi.testclient import TestClient

from src.main import app
from src.config.storage import UPLOAD_DIR
from src.middlewares.auth import get_current_user

MOCK_USER = {"id": 1, "username": "testuser", "email": "test@school.fr", "role": "admin"}
MOCK_STUDENTS = [
    {
        "id": 1,
        "first_name": "Jean",
        "last_name": "Dupont",
        "email": "jean@school.fr",
        "class_id": 1,
        "photo_url": None,
    },
]


@pytest.fixture(autouse=True)
def override_auth():
    app.dependency_overrides[get_current_user] = lambda: MOCK_USER
    yield
    app.dependency_overrides.pop(get_current_user, None)


client = TestClient(app)


class TestTrombiHTML:
    def test_returns_200_and_html_document(self):
        with patch("src.routers.trombi.StudentModel.find_all") as mock_students, patch(
            "src.routers.trombi.ExportModel.create"
        ):
            mock_students.return_value = MOCK_STUDENTS
            res = client.get("/api/trombi/?format=html")
        assert res.status_code == 200
        assert "text/html" in res.headers["content-type"]
        assert "Trombinoscope" in res.text
        assert "Jean" in res.text
        assert "RGPD" in res.text

    def test_includes_class_label_when_class_id_provided(self):
        with patch("src.routers.trombi.StudentModel.find_all") as mock_students, patch(
            "src.routers.trombi.ClassModel.find_by_id"
        ) as mock_class, patch("src.routers.trombi.ExportModel.create"):
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
            with patch(
                "src.routers.trombi.StudentModel.find_all"
            ) as mock_students, patch(
                "src.routers.trombi.generate_pdf"
            ) as mock_pdf, patch(
                "src.routers.trombi.ExportModel.create"
            ):
                mock_students.return_value = MOCK_STUDENTS
                mock_pdf.return_value = fake_pdf_path
                res = client.get("/api/trombi/?format=pdf")
            assert res.status_code == 200
            assert "application/pdf" in res.headers["content-type"]
            assert len(res.content) > 0
        finally:
            if os.path.exists(fake_pdf_path):
                os.unlink(fake_pdf_path)


class TestTrombiDownload:
    def test_downloads_saved_html_export(self):
        export_path = Path(UPLOAD_DIR) / "test-export.html"
        export_path.write_text(
            "<!DOCTYPE html><html><body>OK</body></html>", encoding="utf-8"
        )
        try:
            with patch("src.routers.trombi.ExportModel.find_by_id") as mock_export:
                mock_export.return_value = {
                    "id": 1,
                    "format": "html",
                    "file_path": str(export_path),
                    "class_label": "3A",
                }
                res = client.get("/api/trombi/exports/1/download")

            assert res.status_code == 200
            assert "text/html" in res.headers["content-type"]
            assert "OK" in res.text
        finally:
            if export_path.exists():
                export_path.unlink()

    def test_regenerates_legacy_html_export_without_file_path(self):
        with patch("src.routers.trombi.ExportModel.find_by_id") as mock_export, patch(
            "src.routers.trombi.StudentModel.find_all"
        ) as mock_students:
            mock_export.return_value = {
                "id": 2,
                "format": "html",
                "file_path": None,
                "class_id": 1,
                "class_label": "3A",
            }
            mock_students.return_value = MOCK_STUDENTS
            res = client.get("/api/trombi/exports/2/download")

        assert res.status_code == 200
        assert "text/html" in res.headers["content-type"]
        assert "Jean" in res.text


class TestTrombiDelete:
    def test_deletes_export_and_saved_file(self):
        export_path = Path(UPLOAD_DIR) / "delete-export.html"
        export_path.write_text("<!DOCTYPE html><html><body>OK</body></html>", encoding="utf-8")
        with patch("src.routers.trombi.ExportModel.find_by_id") as mock_export, patch(
            "src.routers.trombi.ExportModel.delete"
        ) as mock_delete:
            mock_export.return_value = {
                "id": 3,
                "format": "html",
                "file_path": str(export_path),
                "class_label": "3A",
            }
            mock_delete.return_value = True
            res = client.delete("/api/trombi/exports/3")

        assert res.status_code == 204
        assert not export_path.exists()
        mock_delete.assert_called_once_with(3)

    def test_returns_404_when_deleting_missing_export(self):
        with patch("src.routers.trombi.ExportModel.find_by_id") as mock_export:
            mock_export.return_value = None
            res = client.delete("/api/trombi/exports/999")

        assert res.status_code == 404
