from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from aplicacao.utils.responses import success_response, error_response
from aplicacao.models import Hemocentro, db, Agendamento
from datetime import datetime
from flask import Response
from aplicacao.hemocentro.servicos import (
    listar_agendamentos_hemocentro,
    listar_doadores_com_info,
    listar_doadores_com_agendamento,
    listar_doacoes,
    listar_campanhas_hemocentro,
    registrar_doacao,
    montar_perfil_hemocentro,
    criar_campanha,
    excluir_campanha,
    editar_campanha,
    concluir_campanha,
    montar_historico_doacoes,
)
from aplicacao import db

bp_hemocentro = Blueprint("hemocentro", __name__)

# ==========================================================
# 🧩 Função auxiliar centralizada
# ==========================================================
def obter_hemocentro_autenticado():
    """
    Recupera o hemocentro autenticado a partir do token JWT.
    Retorna (hemocentro, claims) ou error_response.
    """
    claims = get_jwt()
    tipo = claims.get("tipo")
    if tipo != "hemocentro":
        return error_response("Acesso negado: tipo de usuário inválido.", 403)

    try:
        hemocentro_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return error_response("Token inválido.", 403)

    hemocentro = Hemocentro.query.get(hemocentro_id)
    if not hemocentro:
        return error_response("Hemocentro não encontrado.", 404)

    return hemocentro, claims


# ==========================================================
# 🩸 Painel do Hemocentro
# ==========================================================
@bp_hemocentro.route("/api/perfil", methods=["GET"])
@jwt_required()
def get_perfil_hemocentro():
    identidade = get_jwt_identity()
    hemocentro_id = identidade["id"] if isinstance(identidade, dict) else int(identidade)
    hemocentro = Hemocentro.query.get(hemocentro_id)

    if not hemocentro:
        return error_response("Hemocentro não encontrado.", 404)

    dados = montar_perfil_hemocentro(hemocentro)
    return success_response("Perfil carregado com sucesso.", data={"perfil": dados})


@bp_hemocentro.route("/api/perfil", methods=["PUT"])
@jwt_required()
def atualizar_perfil_hemocentro():
    try:
        identidade = get_jwt_identity()
        hemocentro_id = identidade["id"] if isinstance(identidade, dict) else int(identidade)
        hemocentro = Hemocentro.query.get(hemocentro_id)

        if not hemocentro:
            return error_response("Hemocentro não encontrado.", 404)

        data = request.get_json() or {}

        # 📝 Campos que podem ser atualizados (corrigidos)
        campos_editaveis = [
            "nome_instituicao", "email", "telefone",
            "logradouro", "numero", "complemento",
            "cidade", "estado", "cep",
            "horario_inicio", "horario_fim"
        ]

        for campo in campos_editaveis:
            if campo in data:
                setattr(hemocentro, campo, data[campo])

        db.session.commit()

        return success_response(
            "Perfil atualizado com sucesso.",
            data={"perfil": montar_perfil_hemocentro(hemocentro)}
        )

    except Exception as e:
        print("❌ Erro ao atualizar perfil:", e)
        db.session.rollback()
        return error_response(f"Erro ao atualizar perfil: {e}", 500)


# ==========================================================
# 📅 Agendamentos
# ==========================================================
@bp_hemocentro.route("/api/agendamentos/hemocentro", methods=["GET"])
@jwt_required()
def api_agendamentos_hemocentro():
    resultado = obter_hemocentro_autenticado()
    if isinstance(resultado, tuple):
        hemocentro, _ = resultado
    else:
        return resultado

    agendamentos = listar_agendamentos_hemocentro(hemocentro.id)
    return success_response(data={"agendamentos": agendamentos})

@bp_hemocentro.route("/api/agendamento/<int:agendamento_id>/reagendar", methods=["PUT"])
@jwt_required()
def api_reagendar_agendamento(agendamento_id):
    """
    Permite que o hemocentro reagende um agendamento de doação.
    """
    try:
        resultado = obter_hemocentro_autenticado()
        if isinstance(resultado, tuple):
            hemocentro, _ = resultado
        else:
            return resultado

        dados = request.get_json() or {}
        nova_data_str = dados.get("data")

        if not nova_data_str:
            return error_response("Data não fornecida.", 400)

        try:
            nova_data = datetime.strptime(nova_data_str, "%Y-%m-%d").date()
        except ValueError:
            return error_response("Formato de data inválido. Use YYYY-MM-DD.", 400)

        agendamento = Agendamento.query.filter_by(
            id=agendamento_id,
            hemocentro_id=hemocentro.id
        ).first()

        if not agendamento:
            return error_response("Agendamento não encontrado.", 404)

        agendamento.data = nova_data
        agendamento.status = "agendado"
        db.session.commit()

        print(f"🔁 Agendamento {agendamento.id} reagendado para {nova_data}")

        return success_response(
            message="Agendamento reagendado com sucesso!",
            data={
                "id": agendamento.id,
                "data": agendamento.data.strftime("%Y-%m-%d"),
                "status": agendamento.status
            }
        )
    except Exception as e:
        print("❌ Erro ao reagendar agendamento:", e)
        db.session.rollback()
        return error_response("Erro interno ao reagendar agendamento.", 500)


# ==========================================================
# 👥 Doadores Aptos
# ==========================================================
@bp_hemocentro.route("/api/doadores", methods=["GET"])
@jwt_required()
def api_doadores_aptos():
    resultado = obter_hemocentro_autenticado()
    if isinstance(resultado, tuple):
        hemocentro, _ = resultado
    else:
        return resultado

    # ✅ Agora o dicionário completo é retornado direto
    doadores_info = listar_doadores_com_info(hemocentro.id)
    return success_response(data=doadores_info)


# ==========================================================
# 🧾 Doações Registradas
# ==========================================================
@bp_hemocentro.route("/api/doacoes", methods=["GET"])
@jwt_required()
def api_doacoes_registradas():
    try:
        identidade = get_jwt_identity()
        print("🔍 Identidade no token:", identidade)

        resultado = obter_hemocentro_autenticado()
        if isinstance(resultado, tuple):
            hemocentro, _ = resultado
        else:
            return resultado  # erro_response vindo de dentro

        doacoes = listar_doacoes(hemocentro.id)

        resposta = []
        for d in doacoes:
            resposta.append({
                "id": d["id"],
                "data_doacao": d["data"],  # ✅ renomeado
                "horario": d["horario"] if isinstance(d["horario"], str)
                            else (d["horario"].strftime("%H:%M") if d["horario"] else None),
                "doador_nome": d["doador_nome"],
                "tipo_sanguineo": d.get("tipo_sanguineo", "N/A"),  # ✅ novo campo
                "tipo_doacao": d["tipo_doacao"],
                "volume": d["volume"],
                "hemoglobina": d.get("hemoglobina", "-"),          # ✅ novo campo
                "pressao_arterial": d.get("pressao_arterial", "-"),# ✅ novo campo
                "status": d["status"],
            })

        return success_response(
            "Doações carregadas com sucesso.",
            data={"doacoes": resposta}
        )

    except Exception as e:
        print("❌ Erro ao montar resposta de doações:", e)
        return error_response("Erro interno ao carregar doações.", 500)


# ==========================================================
# 🧾 Listar Hemocentros
# ==========================================================
@bp_hemocentro.route("/api/listar", methods=["GET"])
def listar_hemocentros():
    try:
        hemocentros = Hemocentro.query.all()
        lista = [
            {
                "id": h.id,
                "nome_instituicao": h.nome_instituicao,
                "email": h.email,
                "telefone": h.telefone,
                "cidade": h.cidade,
                "estado": h.estado,
                "endereco": f"{h.logradouro}, {h.numero}",
            }
            for h in hemocentros
        ]

        return success_response(
            message="Lista de hemocentros obtida com sucesso.",
            data=lista,
        )

    except Exception as e:
        print("❌ Erro ao listar hemocentros:", e)
        return error_response("Erro interno ao listar hemocentros.", 500)


# ==========================================================
# 🧾 Doadores com Agendamento
# ==========================================================
@bp_hemocentro.route("/api/doadores-com-agendamento", methods=["GET"])
@jwt_required()
def api_doadores_com_agendamento():
    """
    Lista todos os doadores com agendamentos ativos (não cancelados)
    para o hemocentro autenticado.
    """
    try:
        resultado = obter_hemocentro_autenticado()
        if isinstance(resultado, tuple):
            hemocentro, _ = resultado
        else:
            return resultado

        agendamentos = Agendamento.query.filter(
            Agendamento.hemocentro_id == hemocentro.id,
            Agendamento.status.in_(["agendado", "pendente"])
        ).all()

        lista = []
        for ag in agendamentos:
            if ag.doador:
                lista.append({
                    "id": ag.doador.id,
                    "nome": ag.doador.nome,
                    "tipo_sanguineo": ag.doador.tipo_sanguineo,
                    "tipo_doacao_agendada": ag.tipo_doacao,
                    "data_agendamento": ag.data.strftime("%d/%m/%Y"),
                })

        return success_response(data={"doadores": lista})

    except Exception as e:
        print("❌ Erro ao listar doadores com agendamento:", e)
        return error_response("Erro interno ao listar doadores com agendamento.", 500)

# ==========================================================
# 🩸 Registrar uma nova doação
# ==========================================================
@bp_hemocentro.route("/api/registrar-doacao", methods=["POST"])
@jwt_required()
def api_registrar_doacao():
    resultado = obter_hemocentro_autenticado()
    if isinstance(resultado, tuple):
        hemocentro, _ = resultado
    else:
        return resultado

    dados = request.get_json() or {}

    obrigatorios = ["doador_id", "tipo_sanguineo", "data_doacao"]
    if not all(k in dados and dados[k] for k in obrigatorios):
        return error_response("Campos obrigatórios ausentes.", 400)

    payload = {
        "doador_id": dados.get("doador_id"),
        "tipo_sanguineo": dados.get("tipo_sanguineo"),
        "data_doacao": dados.get("data_doacao"),
        "horario": dados.get("horario"),
        "volume": dados.get("volume", 450),
        "tipo_doacao": dados.get("tipo_doacao", "sangue_total"),
        "peso": dados.get("peso"),
        "temperatura": dados.get("temperatura"),
        "pressao_arterial": dados.get("pressao_arterial"),
        "hemoglobina": dados.get("hemoglobina"),
        "observacoes": dados.get("observacoes"),
    }

    print("📦 Dados recebidos para registrar doação:", payload)

    nova_doacao = registrar_doacao(hemocentro.id, payload)

    if not nova_doacao:
        return error_response("Falha ao registrar doação.", 500)

    return success_response(
        "Doação registrada com sucesso!",
        data={
            "id": nova_doacao.id,
            "data_doacao": nova_doacao.data_doacao.strftime("%d/%m/%Y"),
            "horario": nova_doacao.horario.strftime("%H:%M") if nova_doacao.horario else None,
            "tipo_doacao": nova_doacao.tipo_doacao,
            "volume": nova_doacao.volume,
            "status": "realizada",
            "hemocentro_nome": hemocentro.nome_instituicao,
        },
    )

# ==========================================================
# 🏥 Informações do Hemocentro
# ==========================================================
@bp_hemocentro.route("/api/hemocentro-info", methods=["GET"])
@jwt_required()
def api_info_hemocentro():
    resultado = obter_hemocentro_autenticado()
    if isinstance(resultado, tuple):
        hemocentro, _ = resultado
    else:
        return resultado

    dados = {
        "id": hemocentro.id,
        "nome": hemocentro.nome_instituicao,
        "cidade": hemocentro.cidade,
        "estado": hemocentro.estado,
        "email": hemocentro.email,
        "telefone": hemocentro.telefone,
        "usuario": hemocentro.usuario,
    }
    return success_response(data={"hemocentro": dados})


# ==========================================================
# 📢 Campanhas do Hemocentro
# ==========================================================
@bp_hemocentro.route("/api/campanhas", methods=["GET"])
@jwt_required()
def api_campanhas_hemocentro():
    """Lista todas as campanhas do hemocentro autenticado"""
    resultado = obter_hemocentro_autenticado()
    if isinstance(resultado, tuple):
        hemocentro, _ = resultado
    else:
        return resultado

    campanhas = listar_campanhas_hemocentro(hemocentro.id)
    return success_response(data={"campanhas": campanhas})


# ==========================================================
# 🧾 Criar nova campanha
# ==========================================================
@bp_hemocentro.route("/api/campanhas", methods=["POST"])
@jwt_required()
def api_campanha_criar():
    resultado = obter_hemocentro_autenticado()
    if isinstance(resultado, tuple):
        hemocentro, _ = resultado
    else:
        return resultado

    dados = request.get_json() or {}
    titulo = dados.get("titulo")

    if not titulo:
        return error_response("Título é obrigatório.", 400)

    try:
        nova = criar_campanha(hemocentro.id, dados)
        db.session.commit()  # 🔥 GARANTE que o commit finalize antes da resposta

        print(f"✅ Campanha criada: {nova.titulo} (ID: {nova.id})")

        return success_response(
            message=f"Campanha '{titulo}' criada com sucesso!",
            data={
                "campanha": {
                    "id": nova.id,
                    "titulo": nova.titulo,
                    "descricao": nova.descricao,
                    "local": nova.local,
                    "data_inicio": nova.data_inicio.strftime('%Y-%m-%d'),
                    "data_fim": nova.data_fim.strftime('%Y-%m-%d'),
                    "status": nova.status,
                    "data_criacao": nova.data_criacao.strftime('%Y-%m-%d'),
                    "participantes": nova.participantes
                }
            },
            code=201
        )

    except Exception as e:
        print("❌ Erro ao criar campanha:", e)
        db.session.rollback()
        return error_response("Erro interno ao criar campanha.", 500)


# ==========================================================
# ✏️ Editar campanha existente
# ==========================================================
@bp_hemocentro.route("/api/campanhas/<int:campanha_id>", methods=["PUT"])
@jwt_required()
def api_campanha_editar(campanha_id):
    """Edita uma campanha existente"""
    resultado = obter_hemocentro_autenticado()
    if isinstance(resultado, tuple):
        hemocentro, _ = resultado
    else:
        return resultado

    dados = request.get_json() or {}
    camp, erro = editar_campanha(hemocentro.id, campanha_id, dados)
    if erro:
        return error_response(erro, 400)

    return success_response(
        message=f"Campanha '{camp.titulo}' atualizada com sucesso!",
        data={"campanha": {
            "id": camp.id,
            "titulo": camp.titulo,
            "descricao": camp.descricao,
            "local": camp.local,
            "data_inicio": camp.data_inicio.strftime('%Y-%m-%d'),
            "data_fim": camp.data_fim.strftime('%Y-%m-%d'),
            "status": camp.status,
            "data_criacao": camp.data_criacao.strftime('%Y-%m-%d'),
            "participantes": camp.participantes
        }}
    )


# ==========================================================
# ❌ Excluir campanha
# ==========================================================
@bp_hemocentro.route("/api/campanhas/<int:campanha_id>", methods=["DELETE"])
@jwt_required()
def api_campanha_excluir(campanha_id):
    """Exclui uma campanha existente"""
    resultado = obter_hemocentro_autenticado()
    if isinstance(resultado, tuple):
        hemocentro, _ = resultado
    else:
        return resultado

    sucesso, erro = excluir_campanha(hemocentro.id, campanha_id)
    if not sucesso:
        return error_response(erro, 400)

    return success_response(message=f"Campanha {campanha_id} excluída com sucesso!")


# ==========================================================
# ✅ Concluir campanha
# ==========================================================
@bp_hemocentro.route("/api/campanhas/<int:campanha_id>/concluir", methods=["PUT"])
@jwt_required()
def api_campanha_concluir(campanha_id):
    """Marca uma campanha como concluída"""
    resultado = obter_hemocentro_autenticado()
    if isinstance(resultado, tuple):
        hemocentro, _ = resultado
    else:
        return resultado

    sucesso, erro, camp = concluir_campanha(hemocentro.id, campanha_id)
    if not sucesso:
        return error_response(erro, 400)

    return success_response(
        message=f"Campanha '{camp.titulo}' concluída com sucesso!",
        data={
            "campanha": {
                "id": camp.id,
                "titulo": camp.titulo,
                "descricao": camp.descricao,
                "status": camp.status,
                "data_inicio": camp.data_inicio.strftime('%Y-%m-%d') if camp.data_inicio else None,
                "data_fim": camp.data_fim.strftime('%Y-%m-%d') if camp.data_fim else None,
            }
        }
    )
    
@bp_hemocentro.route("/api/historico/<int:doador_id>", methods=["GET"])
@jwt_required()
def api_historico_doador(doador_id):
    resultado = obter_hemocentro_autenticado()
    if isinstance(resultado, Response):
        return resultado

    hemocentro = resultado if not isinstance(resultado, tuple) else resultado[0]
    historico = montar_historico_doacoes(doador_id)

    return success_response(data={"historico": historico})


    
# ==========================================================
# ⚙️ Endpoint de Teste / Status
# ==========================================================
@bp_hemocentro.route("/api/status", methods=["GET"])
def api_status():
    return success_response("API de hemocentro operacional.")
