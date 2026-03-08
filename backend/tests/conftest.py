"""
Test configuration — uses SQLite for local testing.
"""
import os

# Override DATABASE_URL to use SQLite before any app imports
os.environ["DATABASE_URL"] = "sqlite:///./test_packnow.db"
os.environ["SECRET_KEY"] = "test-secret-key-for-security-testing-only"
os.environ["DEBUG"] = "true"
os.environ["DB_HOST"] = "localhost"
