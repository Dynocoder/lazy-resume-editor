import os

class Config:
    DEBUG = True
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret")
    LLM_API_KEY = os.environ.get("LLM_API_KEY", "dummy-key")
