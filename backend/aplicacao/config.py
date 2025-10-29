import os
from dotenv import load_dotenv

# Carrega variáveis do .env
load_dotenv()

class Config:
    # ==============================
    # 🔐 Segurança
    # ==============================
    SECRET_KEY = os.getenv("SECRET_KEY", "troque-essa-chave")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "troque-essa-chave-jwt")

    # Localização do token JWT
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"
    JWT_ERROR_MESSAGE_KEY = "message"

    # ==============================
    # 🗄️ Banco de Dados
    # ==============================
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_NAME = os.getenv("DB_NAME", "doacao_sangue")

    SQLALCHEMY_DATABASE_URI = (
        f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
        if DB_USER and DB_NAME
        else "sqlite:///banco_teste.db"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ==============================
    # ⚙️ Outros
    # ==============================
    ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1")


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
