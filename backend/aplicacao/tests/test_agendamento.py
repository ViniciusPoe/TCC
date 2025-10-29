from datetime import datetime, timedelta
from aplicacao.core.database import db
from aplicacao import criar_app
from aplicacao.models import Agendamento, Doador, Hemocentro
from flask_jwt_extended import create_access_token

def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def test_agendamento_sucesso():
    app = criar_app(testing=True)
    with app.app_context():
        db.create_all()
        client = app.test_client()

        # Cria doador e hemocentro
        doador = Doador(
            nome="Maria Teste",
            email="maria@teste.com",
            senha="hash",
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

        token = create_access_token(identity={"id": doador.id, "tipo": "doador"})

        data_agendamento = (datetime.utcnow() + timedelta(days=3)).strftime("%Y-%m-%d")

        resp = client.post(
            "/doador/api/agendamento",
            json={
                "data": data_agendamento,
                "tipo_doacao": "sangue_total",
                "hemocentro_id": hemo.id
            },
            headers=auth_header(token)
        )

        assert resp.status_code == 201
        rjson = resp.get_json()
        assert rjson["success"] is True
        assert "Agendamento realizado" in rjson["message"]
        assert Agendamento.query.count() == 1


def test_agendamento_faltando_campo():
    app = criar_app(testing=True)
    with app.app_context():
        db.create_all()
        client = app.test_client()

        doador = Doador(
            nome="Teste",
            email="teste@ex.com",
            senha="hash",
            cpf="111.222.333-44",
            rg="1234567",
            data_nascimento=datetime(1990, 1, 1),
            sexo="M",
            tipo_sanguineo="O+",
            telefone="(11)9",
            telefone_emergencia="(11)9",
            cep="00000-000",
            logradouro="Rua A",
            numero="10",
            bairro="B",
            cidade="C",
            estado="SP",
            peso=70,
            altura=180
        )
        doador.set_senha("123")
        db.session.add(doador)
        db.session.commit()

        token = create_access_token(identity={"id": doador.id, "tipo": "doador"})

        resp = client.post(
            "/doador/api/agendamento",
            json={
                "tipo_doacao": "sangue_total",
                "hemocentro_id": 1
            },
            headers=auth_header(token)
        )
        assert resp.status_code == 400
        rjson = resp.get_json()
        assert rjson["success"] is False
        assert "Campo obrigatório faltando" in rjson["message"]
