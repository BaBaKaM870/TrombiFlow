import sys
import os

# Configure Python path BEFORE any test collection
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

def pytest_configure(config):
    """Pytest hook called before test collection"""
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
