"""Root conftest.py — ensures the project root is on sys.path for pytest discovery."""
import sys
import os

# Add project root to sys.path so scanner package is importable
sys.path.insert(0, os.path.dirname(__file__))
