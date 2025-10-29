from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from aplicacao.utils.responses import success_response, error_response
from aplicacao.models import Doador, db, Agendamento, Doacao
from aplicacao.doador.servicos import (
    listar_hemocentros,
    montar_perfil_doador,
    montar_historico_doacoes,
    listar_campanhas_publicas,
    listar_agendamentos_doador
)
from datetime import datetime, timedelta

bp_doador = Blueprint("doador", __name__)

# ==========================================================
# 🧩 Funções auxiliares
# ==========================================================
def obter_doador_autenticado():
    """
    Recupera o ID e as claims do doador autenticado a partir do token JWT.
    Retorna (doador, claims) ou erro_response se inválido.
    """
    claims = get_jwt()
    tipo = claims.get("tipo")
    if tipo != "doador":
        return error_response("Acesso negado: tipo de usuário inválido.", 403)

    try:
        doador_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return error_response("Token inválido.", 403)

    doador = Doador.query.get(doador_id)
    if not doador:
        return error_response("Doador não encontrado.", 404)

    return doador, claims


# ==========================================================
# 👤 Perfil do Doador
# ==========================================================
@bp_doador.route("/api/perfil", methods=["GET"])
@jwt_required()
def get_perfil_doador():
    identidade = get_jwt_identity()

    # ⚡ compatível com tokens antigos (string) e novos (dict)
    doador_id = identidade["id"] if isinstance(identidade, dict) else int(identidade)

    doador = Doador.query.get(doador_id)
    if not doador:
        return error_response("Doador não encontrado.", 404)

    dados = montar_perfil_doador(doador)
    return success_response("Perfil carregado com sucesso.", data={"carteira": dados})

@bp_doador.route("/api/perfil", methods=["PUT"])
@jwt_required()
def atualizar_perfil_doador():
    try:
        identidade = get_jwt_identity()
        # ✅ Compatível com tokens antigos e novos
        doador_id = identidade["id"] if isinstance(identidade, dict) else int(identidade)

        doador = Doador.query.get(doador_id)
        if not doador:
            return error_response("Doador não encontrado.", 404)

        dados = request.get_json() or {}

        # Campos permitidos para atualização
        campos_editaveis = [
            "email", "sexo", "tipo_sanguineo", "telefone",
            "cep", "logradouro", "numero", "complemento", "bairro",
            "cidade", "estado", "peso", "altura"
        ]

        for campo in campos_editaveis:
            if campo in dados:
                setattr(doador, campo, dados[campo])

        db.session.commit()

        # ✅ Retorna os dados atualizados já no formato da carteira
        return success_response(
            "Perfil atualizado com sucesso.",
            data={"carteira": montar_perfil_doador(doador)}
        )

    except Exception as e:
        print("❌ Erro ao atualizar perfil:", e)
        db.session.rollback()
        return error_response(f"Erro ao atualizar perfil: {e}", 500)

# ==========================================================
# 🩸 Histórico de Doações
# ==========================================================
@bp_doador.route("/api/historico", methods=["GET"])
@jwt_required()
def api_historico_doacoes():
    resultado = obter_doador_autenticado()
    if isinstance(resultado, tuple):
        doador, _ = resultado
    else:
        return resultado

    historico = montar_historico_doacoes(doador.id)
    return success_response(data={"doacoes": historico})


# ==========================================================
# 🏥 Lista de Hemocentros
# ==========================================================
@bp_doador.route("/api/hemocentros", methods=["GET"])
@jwt_required()
def api_lista_hemocentros():
    resultado = obter_doador_autenticado()
    if not isinstance(resultado, tuple):
        return resultado

    lista = listar_hemocentros()

    if not lista:
        return error_response("Nenhum hemocentro disponível no momento.", 404)

    return success_response(
        message="Lista de hemocentros obtida com sucesso.",
        data=lista  # 👈 diretamente a lista, não {"hemocentros": lista}
    )


# ==========================================================
# 📅 Agendamentos do Doador
# ==========================================================
@bp_doador.route("/api/agendamentos/doador", methods=["GET"])
@jwt_required()
def api_agendamentos_doador():
    resultado = obter_doador_autenticado()
    if isinstance(resultado, tuple):
        doador, _ = resultado
    else:
        return resultado

    agendamentos = listar_agendamentos_doador(doador.id)
    return success_response(data={"agendamentos": agendamentos})

# ==========================================================
# 🆕 Criar Agendamento de Doação
# ==========================================================
@bp_doador.route("/api/agendamento", methods=["POST"])
@jwt_required()
def api_criar_agendamento():
    """
    Cria um novo agendamento de doação para o doador autenticado.
    """

    try:
        # Verificar token e obter doador autenticado
        resultado = obter_doador_autenticado()
        if isinstance(resultado, tuple):
            doador, _ = resultado
        else:
            return resultado  # já é uma resposta de erro

        dados = request.get_json() or {}
        hemocentro_id = dados.get("hemocentro_id")
        data_str = dados.get("data")
        tipo_doacao = dados.get("tipo_doacao", "sangue_total")

        # Validação básica
        if not hemocentro_id or not data_str:
            return error_response("Campos obrigatórios ausentes.", 400)

        # Converter data
        try:
            data_agendamento = datetime.strptime(data_str, "%Y-%m-%d").date()
        except ValueError:
            return error_response("Formato de data inválido. Use YYYY-MM-DD.", 400)

        # Criar novo agendamento
        novo = Agendamento(
            doador_id=doador.id,
            hemocentro_id=hemocentro_id,
            data=data_agendamento,
            tipo_doacao=tipo_doacao,
            status="pendente"
        )

        db.session.add(novo)
        db.session.commit()

        print(f"✅ Novo agendamento criado para doador {doador.id}: {novo.data}")

        return success_response(
            message="Agendamento criado com sucesso!",
            data={
                "id": novo.id,
                "data": novo.data.strftime("%Y-%m-%d"),
                "hemocentro_id": novo.hemocentro_id,
                "tipo_doacao": novo.tipo_doacao,
                "status": novo.status
            }
        )

    except Exception as e:
        print("❌ Erro ao criar agendamento:", e)
        db.session.rollback()
        return error_response("Erro interno ao criar agendamento.", 500)

# ==========================================================
# ❌ Cancelar Agendamento
# ==========================================================
@bp_doador.route("/api/agendamento/<int:agendamento_id>/cancelar", methods=["PUT"])
@jwt_required()
def api_cancelar_agendamento(agendamento_id):
    """
    Cancela um agendamento existente, se pertencer ao doador autenticado.
    """
    from datetime import datetime
    from aplicacao.models import db, Agendamento

    try:
        # Autenticação do doador
        resultado = obter_doador_autenticado()
        if isinstance(resultado, tuple):
            doador, _ = resultado
        else:
            return resultado

        agendamento = Agendamento.query.get(agendamento_id)
        if not agendamento:
            return error_response("Agendamento não encontrado.", 404)

        if agendamento.doador_id != doador.id:
            return error_response("Acesso negado: este agendamento não pertence a você.", 403)

        # Atualiza status
        agendamento.status = "cancelado"
        agendamento.data_cancelamento = datetime.utcnow()

        db.session.commit()

        print(f"🗑️ Agendamento {agendamento.id} cancelado por doador {doador.id}")

        return success_response(
            message="Agendamento cancelado com sucesso!",
            data={
                "id": agendamento.id,
                "status": agendamento.status,
                "data_cancelamento": agendamento.data_cancelamento.strftime("%Y-%m-%d %H:%M:%S")
            }
        )

    except Exception as e:
        print("❌ Erro ao cancelar agendamento:", e)
        db.session.rollback()
        return error_response("Erro interno ao cancelar agendamento.", 500)


# ==========================================================
# 🎯 Campanhas Disponíveis
# ==========================================================
@bp_doador.route("/api/campanhas", methods=["GET"])
@jwt_required()
def api_campanhas_doador():
    resultado = obter_doador_autenticado()
    if isinstance(resultado, tuple):
        _, _ = resultado
    else:
        return resultado

    campanhas = listar_campanhas_publicas()
    return success_response(data={"campanhas": campanhas})


# ==========================================================
# 🧾 Registro de Interesse em Campanha
# ==========================================================
@bp_doador.route("/api/campanhas/participar", methods=["POST"])
@jwt_required()
def api_participar_campanha():
    resultado = obter_doador_autenticado()
    if isinstance(resultado, tuple):
        doador, _ = resultado
    else:
        return resultado

    dados = request.get_json() or {}
    campanha_id = dados.get("campanha_id")

    if not campanha_id:
        return error_response("ID da campanha é obrigatório.", 400)

    # Aqui você pode chamar um serviço que relacione o doador à campanha
    # Exemplo: registrar_participacao_campanha(doador.id, campanha_id)
    # Por enquanto, simulação:
    return success_response(
        f"Doador {doador.nome} manifestou interesse na campanha {campanha_id}."
    )
    
# ==========================================================
# 💳 Carteira do Doador
# ==========================================================
@bp_doador.route("/api/carteira", methods=["GET"])
@jwt_required()
def api_carteira_doador():
    """
    Retorna as informações completas da carteira digital do doador.
    Inclui dados pessoais, últimas doações e estatísticas.
    """
    resultado = obter_doador_autenticado()
    if isinstance(resultado, tuple):
        doador, _ = resultado
    else:
        return resultado  # erro_response retornado

    try:
        # Perfil básico
        perfil = montar_perfil_doador(doador)

        # 🔹 Última doação
        ultima_doacao = (
            Doacao.query
            .filter_by(doador_id=doador.id)
            .order_by(Doacao.data_doacao.desc())
            .first()
        )

        # 🔹 Próxima doação sugerida (60 dias após a última)
        proxima_doacao = None
        if ultima_doacao and ultima_doacao.data_doacao:
            proxima_doacao = ultima_doacao.data_doacao + timedelta(days=60)

        # 🔹 Estatísticas gerais
        todas_doacoes = Doacao.query.filter_by(doador_id=doador.id).all()
        total_doacoes = len(todas_doacoes)
        volume_total = sum([d.volume or 0 for d in todas_doacoes])
        vidas_salvas = total_doacoes * 3  # estimativa: cada doação pode salvar 3 vidas

        if total_doacoes >= 20:
            categoria = "Herói"
        elif total_doacoes >= 10:
            categoria = "Doador Ouro"
        elif total_doacoes >= 5:
            categoria = "Doador Prata"
        elif total_doacoes >= 2:
            categoria = "Doador Bronze"
        else:
            categoria = "Iniciante"

        # 🔹 Montagem da carteira completa
        carteira = {
            **perfil,
            "ultima_doacao": (
                ultima_doacao.data_doacao.strftime("%d/%m/%Y")
                if ultima_doacao and ultima_doacao.data_doacao
                else "Nenhuma"
            ),
            "proxima_doacao": (
                proxima_doacao.strftime("%d/%m/%Y")
                if proxima_doacao
                else "Indisponível"
            ),
            "status_doacao": (
                "Apto"
                if (not proxima_doacao or proxima_doacao <= datetime.now().date())
                else "Aguardando"
            ),
            "estatisticas": {
                "doacoes_realizadas": total_doacoes,
                "volume_total_ml": volume_total,
                "vidas_salvas": vidas_salvas,
                "categoria": categoria,
            },
            "qrcode_url": f"https://api.qrserver.com/v1/create-qr-code/?data={doador.id}&size=150x150"
        }

        return success_response(data={"carteira": carteira})

    except Exception as e:
        print("❌ Erro ao gerar carteira:", e)
        return error_response("Erro ao gerar carteira digital.", 500)


# ==========================================================
# 🩺 Endpoint de Teste / Status
# ==========================================================
@bp_doador.route("/api/status", methods=["GET"])
def api_status():
    return success_response("API de doador operacional.")
