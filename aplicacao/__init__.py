from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def criar_app(config_class='config.Config'):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    db.init_app(app)
    
    # Importação dos Blueprints
    from aplicacao.doador.rotas import bp_doador
    from aplicacao.instituicao.rotas import bp_instituicao
    from aplicacao.autenticacao.rotas import bp_autenticacao  # Novo

    # Registro dos Blueprints
    app.register_blueprint(bp_doador, url_prefix='/doador')
    app.register_blueprint(bp_instituicao, url_prefix='/instituicao')
    app.register_blueprint(bp_autenticacao, url_prefix='/')  # Raiz redireciona para login
    
    return app
