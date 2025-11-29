from flask import Flask
from flask_cors import CORS
from sqlalchemy import inspect
from aplicacao.config import Config
from aplicacao.core.database import db
from aplicacao.core.security import configurar_jwt, configurar_bcrypt
from aplicacao.core.utils import configurar_logging
import os

def criar_app(testing=False):
    app = Flask(__name__)

    if testing:
        app.config.from_object(TestConfig)
    else:
        app.config.from_object(Config)

    logger = configurar_logging()
    logger.info("Iniciando aplicação...")

    CORS(
        app,
        resources={r"/*": {"origins": [
            "http://localhost:3000",
            "https://tcc-front-m03e.onrender.com",
        ]}},
        supports_credentials=True,
    )

    db.init_app(app)
    configurar_bcrypt(app)
    configurar_jwt(app)

    from aplicacao.autenticacao.rotas import bp_autenticacao
    from aplicacao.doador.rotas import bp_doador
    from aplicacao.hemocentro.rotas import bp_hemocentro

    app.register_blueprint(bp_autenticacao, url_prefix="/")
    app.register_blueprint(bp_doador, url_prefix="/doador")
    app.register_blueprint(bp_hemocentro, url_prefix="/hemocentro")

    with app.app_context():
        verificar_e_criar_tabelas(logger)

    return app


def verificar_e_criar_tabelas(logger):
    """
    Verifica se as tabelas essenciais existem,
    e se não existirem cria todas.
    """
    inspector = inspect(db.engine)
    tabelas_existentes = inspector.get_table_names()

    tabelas_necessarias = [
        'doadores',
        'hemocentros',
        'agendamentos',
        'doacoes',
        'campanhas'
    ]

    faltando = [t for t in tabelas_necessarias if t not in tabelas_existentes]

    if faltando:
        logger.warning(f"Tabelas faltando: {faltando}. Criando db.create_all()...")
        db.create_all()
        logger.info("Tabelas criadas com sucesso.")
    else:
        logger.info("Todas as tabelas já existem.")
