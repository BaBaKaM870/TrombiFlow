from unittest.mock import patch
from fastapi.testclient import TestClient

from src.main import app

client = TestClient(app)


class TestProfile:
    def test_updates_current_user_profile(self):
        with patch("src.routers.auth.UserModel.update") as mock_update:
            mock_update.return_value = {
                "id": 1,
                "username": "Lyes",
                "email": "lyes@test.fr",
                "role": "teacher",
                "photo_url": None,
            }

            res = client.put(
                "/api/auth/me",
                json={"username": "Lyes", "email": "lyes@test.fr"},
            )

        assert res.status_code == 200
        assert res.json()["username"] == "Lyes"
        assert res.json()["email"] == "lyes@test.fr"

    def test_rejects_empty_profile_username(self):
        res = client.put(
            "/api/auth/me",
            json={"username": "   ", "email": "lyes@test.fr"},
        )

        assert res.status_code == 400
