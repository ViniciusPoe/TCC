import os
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from datetime import timedelta

bcrypt = Bcrypt()
jwt = JWTManager()
limiter = Limiter(key_func=get_remote_address, default_limits=[])


def configurar_jwt(app):
    horas = float(os.getenv("JWT_EXPIRES_HOURS", "8"))
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=horas)
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    jwt.init_app(app)


def configurar_bcrypt(app):
    bcrypt.init_app(app)


def configurar_limiter(app):
    limiter.init_app(app)
