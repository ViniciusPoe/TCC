from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from datetime import timedelta

bcrypt = Bcrypt()
jwt = JWTManager()

def configurar_jwt(app):
    app.config['JWT_SECRET_KEY'] = app.config.get('JWT_SECRET_KEY', 'muda-essa-chave')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    jwt.init_app(app)

def configurar_bcrypt(app):
    bcrypt.init_app(app)
