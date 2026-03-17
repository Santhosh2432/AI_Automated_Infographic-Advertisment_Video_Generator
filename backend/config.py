from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Azure Document Intelligence
    AZURE_DOC_INTEL_ENDPOINT: str
    AZURE_DOC_INTEL_KEY: str

    # Azure Blob Storage
    AZURE_STORAGE_CONNECTION_STRING: str
    AZURE_STORAGE_UPLOAD_CONTAINER: str = "inputdocs"
    AZURE_STORAGE_VIDEO_CONTAINER: str = "videocontainer"
    AZURE_STORAGE_BRANDKIT_CONTAINER: str = "brandkit"

    # Azure OpenAI
    AZURE_OPENAI_ENDPOINT: str
    AZURE_OPENAI_KEY: str
    AZURE_OPENAI_DEPLOYMENT: str

    # Azure AI Speech
    AZURE_SPEECH_KEY: str
    AZURE_SPEECH_REGION: str
    AZURE_SPEECH_VOICE: str = "en-US-JennyNeural"

    # Auth & Database
    MONGODB_CONNECTION_STRING: str = "mongodb://localhost:27017/"
    JWT_SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 hours

    # OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECRET: Optional[str] = None
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
