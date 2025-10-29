import pytest
from flask_jwt_extended import create_access_token
from aplicacao import criar_app
from aplicacao.core.database import db
from aplicacao.models import Doador, Hemocentro
from datetime import datetime

@pytest.fixture
def app():
    app = criar_app(testing=True)

    with app.app_context():
        db.create_all()

        # criar um doador padrão de teste
        doador = Doador(
            nome="Maria Teste",
            email="maria@teste.com",
            senha="hash",  # será sobrescrito com set_senha
            cpf="123.456.789-00",
            rg="112233",
            data_nascimento=datetime(1995, 5, 10),
            sexo="F",
            tipo_sanguineo="A+",
            telefone="(11)99999-9999",
            telefone_emergencia="(11)98888-8888",
            cep="01001-000",
            logradouro="Rua Teste",
            numero="100",
            bairro="Centro",
            cidade="São Paulo",
            estado="SP",
            peso=60.0,
            altura=165
        )
        doador.set_senha("senha123")

        hemo = Hemocentro(
            nome_instituicao="Hemocentro Central",
            cnpj="12.345.678/0001-99",
            logradouro="Rua da Vida",
            numero="50",
            cidade="São Paulo",
            estado="SP",
            cep="01002-000",
            horario_funcionamento="08h às 17h",
            email="contato@hemocentro.com",
            telefone="(11)1234-5678",
            usuario="hemocentro1",
        )
        hemo.set_senha("senha456")

        db.session.add_all([doador, hemo])
        db.session.commit()

        yield app

        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def token_doador(app):
    with app.app_context():
        doador = Doador.query.first()
        return create_access_token(identity={"id": doador.id, "tipo": "doador"})


@pytest.fixture
def token_hemocentro(app):
    with app.app_context():
        hemo = Hemocentro.query.first()
        return create_access_token(identity={"id": hemo.id, "tipo": "hemocentro"})
