import sys
import os
import pytest

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)


def pytest_configure(config):
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)


MOCK_USER = {"id": 1, "username": "testuser", "email": "test@school.fr", "role": "teacher"}


@pytest.fixture(autouse=True)
def override_auth():
    from src.main import app
    from src.middlewares.auth import get_current_user
    app.dependency_overrides[get_current_user] = lambda: MOCK_USER
    yield
    app.dependency_overrides.pop(get_current_user, None)
