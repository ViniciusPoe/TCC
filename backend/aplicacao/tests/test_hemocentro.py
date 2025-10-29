import json
from aplicacao import criar_app
from aplicacao.core.database import db
from aplicacao.models import Hemocentro

def test_cadastro_hemocentro():
    app = criar_app(testing=True)
    with app.app_context():
        db.create_all()
        client = app.test_client()

        dados = {
            "nome_instituicao": "Hemocentro São Paulo",
            "usuario": "contato@hemosp.gov.br",
            "senha": "senhaForte123",
            "telefone": "(11)99999-9999",
            "cnpj": "12.345.678/0001-90",
            "email": "contato@hemosp.gov.br",
            "cep": "01001-000",
            "logradouro": "Av. Paulista",
            "numero": "1500",
            "complemento": "9º andar",
            "bairro": "Bela Vista",
            "cidade": "São Paulo",
            "estado": "SP",
            "horario_funcionamento": "08:00 às 18:00"
        }

        resp = client.post(
            '/api/cadastro/hemocentro',
            data=json.dumps(dados),
            content_type='application/json'
        )

        assert resp.status_code in (200, 201)
        rjson = resp.get_json()
        assert rjson["success"] is True

        hemo = Hemocentro.query.filter_by(usuario="contato@hemosp.gov.br").first()
        assert hemo is not None
        assert hemo.nome_instituicao == "Hemocentro São Paulo"


def test_login_hemocentro():
    app = criar_app(testing=True)
    with app.app_context():
        db.create_all()
        client = app.test_client()

        dados_cadastro = {
            "nome_instituicao": "Hemocentro São Paulo",
            "usuario": "contato@hemosp.gov.br",
            "senha": "senhaForte123",
            "telefone": "(11)99999-9999",
            "cnpj": "12.345.678/0001-90",
            "email": "contato@hemosp.gov.br",
            "cep": "01001-000",
            "logradouro": "Av. Paulista",
            "numero": "1500",
            "complemento": "",
            "bairro": "Bela Vista",
            "cidade": "São Paulo",
            "estado": "SP",
            "horario_funcionamento": "08:00 às 18:00"
        }

        client.post(
            '/api/cadastro/hemocentro',
            data=json.dumps(dados_cadastro),
            content_type='application/json'
        )

        dados_login = {
            "usuario": "contato@hemosp.gov.br",
            "senha": "senhaForte123"
        }

        resp = client.post(
            '/api/login/hemocentro',
            data=json.dumps(dados_login),
            content_type='application/json'
        )

        assert resp.status_code == 200
        rjson = resp.get_json()
        assert rjson["success"] is True
        assert "token" in rjson
