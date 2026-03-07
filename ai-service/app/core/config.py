import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SERVICE_NAME = "ai-service"
    PORT = int(os.getenv("AI_SERVICE_PORT", "5001"))
    BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:4000")
    ALERT_CALLBACK_PATH = os.getenv("ALERT_CALLBACK_PATH", "/ai/alert")
