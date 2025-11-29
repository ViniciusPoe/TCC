import re
from flask_jwt_extended import create_access_token
from aplicacao.models import Doador, db, Hemocentro

def autenticar_doador(cpf, senha):
    """
    Autentica o doador com base no CPF (com ou sem pontuação) e senha.
    Retorna token JWT e dados do usuário em caso de sucesso.
    """
    if not cpf or not senha:
        return None

    print("🔎 CPF recebido:", cpf)
    cpf_limpo = re.sub(r'\D', '', cpf)
    print("🔎 CPF limpo:", cpf_limpo)

    doador = (
        Doador.query.filter(
            db.func.replace(
                db.func.replace(db.func.replace(Doador.cpf, '.', ''), '-', ''), '/', ''
            ) == cpf_limpo
        ).first()
    )

    print("🔎 Doador encontrado?", bool(doador))
    if doador:
        print("🧑 Nome:", doador.nome)
        print("🪪 CPF armazenado:", doador.cpf)

    doador = (
        Doador.query.filter(
            db.func.replace(
                db.func.replace(db.func.replace(Doador.cpf, '.', ''), '-', ''), '/', ''
            ) == cpf_limpo
        ).first()
    )

    if not doador or not doador.verificar_senha(senha):
        print("⚠️ Falha no login - CPF ou senha incorretos.")
        return None

    token = create_access_token(
        identity=str(doador.id),
        additional_claims={"tipo": "doador"}
    )

    return {
        "token": token,
        "user": {
            "id": doador.id,
            "nome": doador.nome,
            "cpf": doador.cpf,
            "email": doador.email,
            "tipo": "doador",
        }
    }
    
def autenticar_hemocentro(cnpj, senha):
    """
    Autentica o hemocentro com base no CNPJ e senha.
    Retorna token JWT e dados do hemocentro em caso de sucesso.
    """
    hemo = Hemocentro.query.filter_by(cnpj=cnpj).first()
    if not hemo or not hemo.verificar_senha(senha):
        return None

    token = create_access_token(
        identity=str(hemo.id),
        additional_claims={"tipo": "hemocentro"}
    )

    return {
        "token": token,
        "hemocentro": {
            "id": hemo.id,
            "nome_instituicao": hemo.nome_instituicao,
            "cnpj": hemo.cnpj,
            "email": hemo.email,
            "cidade": hemo.cidade,
            "estado": hemo.estado,
            "tipo": "hemocentro",
        }
    }