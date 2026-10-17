import os
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()


def _obrigatoria(nome):
    valor = os.getenv(nome)
    if not valor:
        raise RuntimeError(
            f"Variável de ambiente obrigatória não definida: {nome}. "
            "Veja backend/.env.example."
        )
    return valor


def _montar_uri_banco():
    uri = os.getenv("SQLALCHEMY_DATABASE_URI")
    if uri:
        return uri

    usuario = _obrigatoria("DB_USER")
    senha = _obrigatoria("DB_PASSWORD")
    host = os.getenv("DB_HOST", "localhost")
    nome = _obrigatoria("DB_NAME")
    return (
        f"mysql+pymysql://{quote_plus(usuario)}:{quote_plus(senha)}"
        f"@{host}/{nome}?charset=utf8mb4"
    )


class Config:
    SECRET_KEY = _obrigatoria("SECRET_KEY")
    JWT_SECRET_KEY = _obrigatoria("JWT_SECRET_KEY")

    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"
    JWT_ERROR_MESSAGE_KEY = "message"

    SQLALCHEMY_DATABASE_URI = _montar_uri_banco()
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    ENV = os.getenv("FLASK_ENV", "production")
    DEBUG = os.getenv("FLASK_DEBUG", "False").lower() in ("true", "1")

    CORS_ORIGINS = [
        o.strip()
        for o in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:3000,https://tcc-front-m03e.onrender.com",
        ).split(",")
        if o.strip()
    ]
