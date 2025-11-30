from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from aplicacao.utils.responses import success_response, error_response
from aplicacao.models import Hemocentro, db, Agendamento, Doador
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
    atualizar_campanhas_expiradas,
    listar_doadores_com_agendamento_global
)
from aplicacao import db

bp_hemocentro = Blueprint("hemocentro", __name__)

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
        agendamento.status = "pendente"
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

@bp_hemocentro.route("/api/agendamento", methods=["POST"])
@jwt_required()
def api_criar_agendamento_hemocentro():
    """
    Hemocentro cria um agendamento para um doador específico.
    """
    try:
        resultado = obter_hemocentro_autenticado()
        if isinstance(resultado, tuple):
            hemocentro, _ = resultado
        else:
            # Se for error_response, só retorna
            return resultado

        dados = request.get_json() or {}
        data_str = dados.get("data")
        doador_id = dados.get("doador_id")
        tipo_doacao = dados.get("tipo_doacao", "sangue_total")

        if not data_str or not doador_id:
            return error_response("Data e doador são obrigatórios.", 400)

        # data vem no formato YYYY-MM-DD
        try:
            data = datetime.strptime(data_str, "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                "Formato de data inválido. Use YYYY-MM-DD.",
                400
            )

        doador = Doador.query.get(doador_id)
        if not doador:
            return error_response("Doador não encontrado.", 404)

        # ❗ Bloqueia se o doador já tiver qualquer agendamento pendente
        agendamento_existente = Agendamento.query.filter(
            Agendamento.doador_id == doador_id,
            Agendamento.status.in_(["pendente"])
        ).first()

        if agendamento_existente:
            return error_response(
                "Este doador já possui um agendamento pendente.",
                400
            )

        novo = Agendamento(
            data=data,
            status="pendente",
            tipo_doacao=tipo_doacao,
            doador_id=doador_id,
            hemocentro_id=hemocentro.id,
        )

        db.session.add(novo)
        db.session.commit()

        print(
            f"✅ Agendamento criado pelo hemocentro {hemocentro.id} "
            f"para o doador {doador_id} em {data}"
        )

        return success_response(
            "Agendamento criado com sucesso!",
            data={
                "id": novo.id,
                "data": novo.data.strftime("%Y-%m-%d"),
                "status": novo.status,
                "tipo_doacao": novo.tipo_doacao,
            },
            code=201,
        )

    except Exception as e:
        print("❌ Erro ao criar agendamento (hemocentro):", e)
        db.session.rollback()
        return error_response("Erro interno ao criar agendamento.", 500)    


@bp_hemocentro.route("/api/doadores", methods=["GET"])
@jwt_required()
def api_doadores_aptos():
    resultado = obter_hemocentro_autenticado()
    if isinstance(resultado, tuple):
        hemocentro, _ = resultado
    else:
        return resultado

    doadores_info = listar_doadores_com_info(hemocentro.id)
    return success_response(data=doadores_info)


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
            return resultado 

        doacoes = listar_doacoes(hemocentro.id)

        resposta = []
        for d in doacoes:
            resposta.append({
                "id": d["id"],
                "data_doacao": d["data"],
                "horario": d["horario"] if isinstance(d["horario"], str)
                            else (d["horario"].strftime("%H:%M") if d["horario"] else None),
                "doador_nome": d["doador_nome"],
                "tipo_sanguineo": d.get("tipo_sanguineo", "N/A"), 
                "tipo_doacao": d["tipo_doacao"],
                "volume": d["volume"],
                "hemoglobina": d.get("hemoglobina", "-"),          
                "pressao_arterial": d.get("pressao_arterial", "-"),
                "status": d["status"],
            })

        return success_response(
            "Doações carregadas com sucesso.",
            data={"doacoes": resposta}
        )

    except Exception as e:
        print("❌ Erro ao montar resposta de doações:", e)
        return error_response("Erro interno ao carregar doações.", 500)


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


@bp_hemocentro.route("/api/doadores-com-agendamento", methods=["GET"])
@jwt_required()
def api_doadores_com_agendamento():
    try:
        resultado = obter_hemocentro_autenticado()
        if isinstance(resultado, tuple):
            hemocentro, _ = resultado
        else:
            return resultado

        agendamentos = Agendamento.query.filter(
            Agendamento.hemocentro_id == hemocentro.id,
            Agendamento.status.in_(["pendente"])  # 👈 aqui
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
    
@bp_hemocentro.route("/api/doadores-com-agendamento-global", methods=["GET"])
@jwt_required()
def api_doadores_com_agendamento_global():
    """
    Retorna doadores que possuem AGENDAMENTO PENDENTE
    em QUALQUER hemocentro.
    Serve para BLOQUEAR novos agendamentos na tela de doadores.
    """
    try:
        resultado = obter_hemocentro_autenticado()
        if isinstance(resultado, Response):
            return resultado

        doadores = listar_doadores_com_agendamento_global()
        return success_response(data={"doadores": doadores})
    except Exception as e:
        print("❌ Erro ao listar doadores com agendamento global:", e)
        return error_response(
            "Erro interno ao listar doadores com agendamento global.", 500
        )

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

@bp_hemocentro.route("/api/campanhas", methods=["GET"])
@jwt_required()
def api_campanhas_hemocentro():
    """Lista todas as campanhas do hemocentro autenticado"""
    resultado = obter_hemocentro_autenticado()
    if isinstance(resultado, tuple):
        hemocentro, _ = resultado
    else:
        return resultado
    try:
        atualizadas = atualizar_campanhas_expiradas(hemocentro.id)
        if atualizadas:
            print(f"✅ {atualizadas} campanhas atualizadas para 'concluida' (hemocentro {hemocentro.id})")
    except Exception as e:
        print("⚠️ Erro ao atualizar campanhas expiradas:", e)

    campanhas = listar_campanhas_hemocentro(hemocentro.id)
    return success_response(data={"campanhas": campanhas})

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
        db.session.commit()

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

@bp_hemocentro.route("/api/status", methods=["GET"])
def api_status():
    return success_response("API de hemocentro operacional.")
