from unittest.mock import patch

from fastapi.testclient import TestClient

from src.main import app
from src.middlewares.auth import get_current_user

client = TestClient(app)

TEACHER = {
    "id": 2,
    "username": "teacher",
    "email": "teacher@test.fr",
    "role": "teacher",
}
ADMIN = {"id": 1, "username": "admin", "email": "admin@test.fr", "role": "admin"}


def test_teacher_can_read_students():
    app.dependency_overrides[get_current_user] = lambda: TEACHER
    try:
        with patch("src.routers.students.StudentModel.find_all") as mock:
            mock.return_value = []
            res = client.get("/api/students/")
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert res.status_code == 200


def test_teacher_cannot_create_student():
    app.dependency_overrides[get_current_user] = lambda: TEACHER
    try:
        res = client.post(
            "/api/students/",
            json={"first_name": "Jean", "last_name": "Dupont", "email": "jean@test.fr"},
        )
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert res.status_code == 403


def test_admin_can_list_users():
    app.dependency_overrides[get_current_user] = lambda: ADMIN
    try:
        with patch("src.routers.users.UserModel.find_all") as mock:
            mock.return_value = [ADMIN, TEACHER]
            res = client.get("/api/users")
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert res.status_code == 200
    assert len(res.json()) == 2


def test_teacher_cannot_list_users():
    app.dependency_overrides[get_current_user] = lambda: TEACHER
    try:
        res = client.get("/api/users")
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert res.status_code == 403


def test_admin_can_list_admin_requests():
    app.dependency_overrides[get_current_user] = lambda: ADMIN
    try:
        with patch("src.routers.admin_requests.AdminRequestModel.list_pending") as mock:
            mock.return_value = [
                {
                    "id": 1,
                    "user_id": 2,
                    "status": "pending",
                    "username": "teacher",
                    "email": "teacher@test.fr",
                }
            ]
            res = client.get("/api/admin-requests")
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert res.status_code == 200
    assert len(res.json()) == 1


def test_teacher_cannot_list_admin_requests():
    app.dependency_overrides[get_current_user] = lambda: TEACHER
    try:
        res = client.get("/api/admin-requests")
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert res.status_code == 403
