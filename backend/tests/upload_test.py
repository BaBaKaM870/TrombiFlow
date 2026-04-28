from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from src.main import app

client = TestClient(app)

# Minimal valid JPEG header (FFD8FFE0 + padding)
TINY_JPEG = bytes([0xFF, 0xD8, 0xFF, 0xE0]) + b"\x00" * 16


class TestPhotoUpload:
    def test_returns_415_when_file_type_is_not_image(self):
        res = client.post(
            "/api/students/1/photo",
            files={"photo": ("evil.pdf", b"not an image", "application/pdf")},
        )
        assert res.status_code == 415

    def test_returns_404_when_student_does_not_exist(self):
        with patch("src.routers.students.StudentModel.find_by_id") as mock_find, \
             patch("src.routers.students.resize_photo") as mock_resize, \
             patch("builtins.open", MagicMock()):
            mock_find.return_value = None
            mock_resize.return_value = "/tmp/photo.jpg"
            res = client.post(
                "/api/students/999/photo",
                files={"photo": ("test.jpg", TINY_JPEG, "image/jpeg")},
            )
        assert res.status_code == 404

    def test_resizes_photo_and_updates_student(self, tmp_path):
        fake_photo = tmp_path / "photo.jpg"
        fake_photo.write_bytes(b"fake image data")

        with patch("src.routers.students.StudentModel.find_by_id") as mock_find, \
             patch("src.routers.students.StudentModel.update_photo") as mock_update, \
             patch("src.routers.students.resize_photo") as mock_resize, \
             patch("src.routers.students.UPLOAD_DIR", str(tmp_path)):
            mock_find.return_value = {"id": 1, "first_name": "Jean", "last_name": "Dupont"}
            mock_update.return_value = {
                "id": 1, "first_name": "Jean", "last_name": "Dupont", "photo_url": "uploads/photo.jpg"
            }
            mock_resize.return_value = str(fake_photo)
            res = client.post(
                "/api/students/1/photo",
                files={"photo": ("test.jpg", TINY_JPEG, "image/jpeg")},
            )
        assert res.status_code == 200
        assert res.json()["photo_url"] is not None
        mock_resize.assert_called_once()

    def test_rejects_non_image_files(self):
        res = client.post(
            "/api/students/1/photo",
            files={"photo": ("evil.pdf", b"not an image", "application/pdf")},
        )
        assert res.status_code in (400, 415, 422)
