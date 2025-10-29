import json
from aplicacao import criar_app
from aplicacao.core.database import db
from aplicacao.models import Doador

def test_cadastro_doador():
    app = criar_app(testing=True)
    with app.app_context():
        db.create_all()
        client = app.test_client()

        dados_doador = {
            "nome": "Vinicius",
            "email": "vinicius@example.com",
            "senha": "senhaSegura123",
            "cpf": "12345678900",
            "rg": "1234567",
            "data_nascimento": "2000-05-15",
            "sexo": "M",
            "tipo_sanguineo": "O+",
            "telefone": "(11)98765-4321",
            "telefone_emergencia": "(11)91234-5678",
            "cep": "12345-678",
            "logradouro": "Rua das Flores",
            "numero": "123",
            "complemento": "Apto 45",
            "bairro": "Centro",
            "cidade": "São Paulo",
            "estado": "SP",
            "peso": 75.5,
            "altura": 180
        }

        resposta = client.post(
            '/api/cadastro/doador',
            data=json.dumps(dados_doador),
            content_type='application/json'
        )

        assert resposta.status_code in (200, 201)
        data = resposta.get_json()
        assert data["success"] is True

        doador = Doador.query.filter_by(email="vinicius@example.com").first()
        assert doador is not None
        assert doador.cpf == "12345678900"


def test_login_doador():
    app = criar_app(testing=True)
    with app.app_context():
        db.create_all()
        client = app.test_client()

        # cadastra primeiro
        dados_cadastro = {
            "nome": "Carlos Teste",
            "email": "carlos@example.com",
            "senha": "senha123",
            "cpf": "98765432100",
            "rg": "7654321",
            "data_nascimento": "1998-03-10",
            "sexo": "M",
            "tipo_sanguineo": "A+",
            "telefone": "(21)99876-1234",
            "telefone_emergencia": "(21)90000-0000",
            "cep": "22222-222",
            "logradouro": "Av. Atlântica",
            "numero": "500",
            "complemento": "",
            "bairro": "Copacabana",
            "cidade": "Rio de Janeiro",
            "estado": "RJ",
            "peso": 80.0,
            "altura": 175
        }
        client.post(
            '/api/cadastro/doador',
            data=json.dumps(dados_cadastro),
            content_type='application/json'
        )

        # login
        dados_login = {
            "email": "carlos@example.com",
            "senha": "senha123"
        }
        resposta = client.post(
            '/api/login/doador',
            data=json.dumps(dados_login),
            content_type='application/json'
        )

        assert resposta.status_code == 200
        data = resposta.get_json()
        assert data["success"] is True
        assert "token" in data
