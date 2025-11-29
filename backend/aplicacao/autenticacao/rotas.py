from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from aplicacao.core.database import db
from aplicacao.models import Doador, Hemocentro
from aplicacao.autenticacao.servicos import autenticar_doador, autenticar_hemocentro
from aplicacao.utils.responses import success_response, error_response
from aplicacao.utils.validators import validar_campos_obrigatorios
from datetime import datetime, timedelta
import logging
from werkzeug.security import check_password_hash, generate_password_hash

bp_autenticacao = Blueprint("autenticacao", __name__)
logger = logging.getLogger(__name__)


@bp_autenticacao.route("/api/login/doador", methods=["POST"])
def api_login_doador():
    data = request.get_json() or {}
    print("🟡 Dados recebidos do React:", data)

    cpf = data.get("cpf")
    senha = data.get("senha")
    print(f"🟢 CPF recebido: {cpf}")
    print(f"🟢 SENHA recebida: '{senha}' (len={len(senha) if senha else 0})")

    if not cpf or not senha:
        return error_response("CPF e senha são obrigatórios", 400)

    auth_data = autenticar_doador(cpf, senha)
    if not auth_data:
        return error_response("CPF ou senha incorretos", 401)

    return success_response(
        "Login realizado com sucesso!",
        data=auth_data,
        code=200
    )

@bp_autenticacao.route("/api/login/hemocentro", methods=["POST"])
def api_login_hemocentro():
    data = request.get_json() or {}
    cnpj = data.get("cnpj")
    senha = data.get("senha")

    if not cnpj or not senha:
        return error_response("CNPJ e senha são obrigatórios", 400)

    auth_data = autenticar_hemocentro(cnpj, senha)
    if not auth_data:
        return error_response("CNPJ ou senha incorretos", 401)

    hemocentro = auth_data.get("hemocentro", {})

    return jsonify({
        "success": True,
        "message": "Login realizado com sucesso!",
        "token": auth_data.get("token"),
        "user": {
            "id": hemocentro.get("id"),
            "nome": hemocentro.get("nome_instituicao"),
            "cnpj": hemocentro.get("cnpj"),
            "email": hemocentro.get("email"),
            "cidade": hemocentro.get("cidade"),
            "estado": hemocentro.get("estado"),
            "tipo": "hemocentro"
        }
    }), 200

@bp_autenticacao.route("/api/check-auth", methods=["GET"])
@jwt_required()
def check_auth():
    user_id = get_jwt_identity()
    claims = get_jwt()
    tipo = claims.get("tipo")

    if tipo == "doador":
        user = Doador.query.get(user_id)
        if not user:
            return error_response("Doador não encontrado", 404)
        return success_response(
            data={
                "user": {
                    "id": user.id,
                    "nome": user.nome,
                    "email": user.email,
                    "tipo": "doador",
                }
            }
        )

    if tipo == "hemocentro":
        user = Hemocentro.query.get(user_id)
        if not user:
            return error_response("Hemocentro não encontrado", 404)
        return success_response(
            data={
                "user": {
                    "id": user.id,
                    "nome": user.nome_instituicao,
                    "tipo": "hemocentro",
                }
            }
        )

    return error_response("Tipo de usuário inválido no token", 400)


@bp_autenticacao.route('/api/cadastro/doador', methods=['POST'])
def api_cadastro_doador():
    data = request.get_json() or {}
    logger.info(f"Cadastro de doador recebido: {data}")

    campos_obrigatorios = [
        'nome', 'data_nascimento', 'cpf', 'rg', 'sexo', 'tipo_sanguineo',
        'email', 'telefone', 'cep', 'cidade', 'logradouro', 'numero',
        'bairro', 'estado', 'peso', 'altura', 'senha', 'ultima_doacao_tipo'
    ]
    
    erro = validar_campos_obrigatorios(data, campos_obrigatorios)
    if erro:
        return error_response(erro, 400)

    if Doador.query.filter_by(cpf=data['cpf']).first():
        return error_response("CPF já cadastrado", 400)
    if Doador.query.filter_by(email=data['email']).first():
        return error_response("E-mail já cadastrado", 400)

    ultima_doacao = None
    proxima_doacao = None
    
    if data['ultima_doacao_tipo'] == 'nunca':
        ultima_doacao = None
        proxima_doacao = None
    elif data['ultima_doacao_tipo'] == 'doador':
        if data.get('ultima_doacao'):
            try:
                ultima_doacao = datetime.strptime(data['ultima_doacao'], '%Y-%m-%d').date()
                proxima_doacao = ultima_doacao + timedelta(days=60)
            except ValueError:
                return error_response("Data da última doação inválida", 400)
        else:
            return error_response("Data da última doação é obrigatória para doadores", 400)

    novo_doador = Doador(
        nome=data['nome'],
        data_nascimento=datetime.strptime(data['data_nascimento'], '%Y-%m-%d').date(),
        cpf=data['cpf'],
        rg=data['rg'],
        sexo=data['sexo'],
        tipo_sanguineo=data['tipo_sanguineo'],
        email=data['email'],
        telefone=data['telefone'],
        cep=data['cep'],
        cidade=data['cidade'],
        logradouro=data['logradouro'],
        numero=data['numero'],
        complemento=data.get('complemento', ''),
        bairro=data['bairro'],
        estado=data['estado'],
        peso=float(data['peso']),
        altura=int(data['altura']),
        ultima_doacao_tipo=data['ultima_doacao_tipo'],
        ultima_doacao=ultima_doacao,
        proxima_doacao=proxima_doacao
    )
    novo_doador.set_senha(data['senha'])

    try:
        db.session.add(novo_doador)
        db.session.commit()
        return success_response(
            "Cadastro realizado com sucesso! Você já pode fazer login.",
            data={"id": novo_doador.id},
            code=201
        )
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao cadastrar doador: {e}")
        return error_response(f"Erro no cadastro: {str(e)}", 500)
    
@bp_autenticacao.route('/api/cadastro/hemocentro', methods=['POST'])
def api_cadastro_hemocentro():
    data = request.get_json() or {}
    logger.info(f"Cadastro de hemocentro recebido: {data}")

    campos_obrigatorios = [
        'nome_instituicao', 'cnpj', 'logradouro', 'numero',
        'cidade', 'estado', 'cep', 'horario_inicio', 'horario_fim',
        'email', 'telefone', 'senha'
    ]
    erro = validar_campos_obrigatorios(data, campos_obrigatorios)
    if erro:
        return error_response(erro, 400)

    if Hemocentro.query.filter_by(cnpj=data['cnpj']).first():
        return error_response("CNPJ já cadastrado", 400)
    if Hemocentro.query.filter_by(email=data['email']).first():
        return error_response("E-mail já cadastrado", 400)
    
    novo_hemo = Hemocentro(
        nome_instituicao=data['nome_instituicao'],
        cnpj=data['cnpj'],
        logradouro=data['logradouro'],
        numero=data['numero'],
        complemento=data.get('complemento', ''),
        cidade=data['cidade'],
        estado=data['estado'],
        cep=data['cep'],
        horario_inicio=data['horario_inicio'],
        horario_fim=data['horario_fim'],
        email=data['email'],
        telefone=data['telefone'],
    )
    novo_hemo.set_senha(data['senha'])

    try:
        db.session.add(novo_hemo)
        db.session.commit()
        return success_response(
            "Cadastro realizado com sucesso! Você já pode fazer login.",
            data={"id": novo_hemo.id},
            code=201
        )
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao cadastrar hemocentro: {e}")
        return error_response(f"Erro no cadastro: {str(e)}", 500)

@bp_autenticacao.route("/api/alterar_senha", methods=["PUT"])
@jwt_required()
def alterar_senha():
    """
    Endpoint unificado para alterar senha (doador ou hemocentro).
    Requer autenticação via JWT.
    """
    try:
        dados = request.get_json()
        senha_atual = dados.get("senha_atual")
        nova_senha = dados.get("nova_senha")

        if not senha_atual or not nova_senha:
            return error_response("Campos obrigatórios não informados.", 400)

        claims = get_jwt()
        tipo_usuario = claims.get("tipo")
        user_id = int(get_jwt_identity())

        if tipo_usuario == "doador":
            usuario = Doador.query.get(user_id)
        elif tipo_usuario == "hemocentro":
            usuario = Hemocentro.query.get(user_id)
        else:
            return error_response("Tipo de usuário inválido.", 403)

        if not usuario:
            return error_response("Usuário não encontrado.", 404)

        if not usuario.verificar_senha(senha_atual):
            return error_response("Senha atual incorreta.", 401)

        usuario.set_senha(nova_senha)
        db.session.commit()

        return success_response(message="Senha alterada com sucesso.")

    except Exception as e:
        print("❌ Erro ao alterar senha:", e)
        db.session.rollback()
        return error_response(f"Erro ao alterar senha: {e}", 500)