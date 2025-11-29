from datetime import datetime, timedelta, date
from aplicacao.core.database import db
from aplicacao.models import (
    Agendamento,
    Doador,
    Hemocentro,
    Doacao,
    Campanha
)
from aplicacao.utils.helpers import parse_data_iso, proxima_doacao_a_partir, is_apto_para_doar


def montar_perfil_doador(doador):
    """Monta o dicionário completo de informações do doador, incluindo última e próxima doação."""
    
    ultima_doacao_registrada = (
        Doacao.query
        .filter_by(doador_id=doador.id)
        .order_by(Doacao.data_doacao.desc())
        .first()
    )

    if ultima_doacao_registrada and ultima_doacao_registrada.data_doacao:
        ultima_doacao = ultima_doacao_registrada.data_doacao
        proxima_doacao = ultima_doacao + timedelta(days=90)
    else:
        ultima_doacao = doador.ultima_doacao
        proxima_doacao = doador.proxima_doacao

    return {
        "id": doador.id,
        "nome": doador.nome,
        "email": doador.email,
        "cpf": doador.cpf,
        "rg": doador.rg,
        "data_nascimento": (
            doador.data_nascimento.strftime("%d/%m/%Y")
            if doador.data_nascimento else None
        ),
        "sexo": doador.sexo,
        "tipo_sanguineo": doador.tipo_sanguineo,
        "telefone": doador.telefone,
        "cep": doador.cep,
        "logradouro": doador.logradouro,
        "numero": doador.numero,
        "complemento": doador.complemento,
        "bairro": doador.bairro,
        "cidade": doador.cidade,
        "estado": doador.estado,
        "peso": doador.peso,
        "altura": doador.altura,
        "data_cadastro": (
            doador.data_cadastro.strftime("%d/%m/%Y")
            if getattr(doador, "data_cadastro", None)
            else None
        ),

        "ultima_doacao": (
            ultima_doacao.strftime("%d/%m/%Y")
            if ultima_doacao else "Nenhuma"
        ),
        "proxima_doacao": (
            proxima_doacao.strftime("%d/%m/%Y")
            if proxima_doacao else "Indefinida"
        ),
    }


def montar_historico_doacoes(doador_id: int):
    doacoes = (
        Doacao.query
        .filter_by(doador_id=doador_id)
        .order_by(Doacao.data_doacao.desc())
        .all()
    )
    
    lista = []
    for doacao in doacoes:
        lista.append({
            'id': doacao.id,
            'data': doacao.data_doacao.strftime('%d/%m/%Y') if doacao.data_doacao else None,
            'horario': doacao.horario.strftime('%H:%M') if doacao.horario else None,
            'local': doacao.hemocentro.nome_instituicao if doacao.hemocentro else 'Hemocentro',
            'volume': doacao.volume,
            'tipo_doacao': doacao.tipo_doacao,
            'hemoglobina': doacao.hemoglobina,
            'pressao_arterial': doacao.pressao_arterial,
            'status': doacao.status
        })
    return lista

def listar_hemocentros():
    hemocentros = Hemocentro.query.all()
    saida = []
    for h in hemocentros:
        saida.append({
            'id': h.id,
            'nome': h.nome_instituicao,
            'endereco': f"{h.logradouro}, {h.numero}",
            'cidade': h.cidade,
            'estado': h.estado,
            'telefone': h.telefone,
            'horario_funcionamento': f"{h.horario_inicio} - {h.horario_fim}",
            'tipos_sanguineos_aceitos': 'A+, A-, B+, B-, AB+, AB-, O+, O-'
        })
    return saida


def criar_agendamento(doador_id, data_iso, tipo_doacao, hemocentro_id):
    doador = Doador.query.get(doador_id)
    if not doador:
        return None, "Doador não encontrado"

    hemocentro = Hemocentro.query.get(hemocentro_id)
    if not hemocentro:
        return None, "Hemocentro não encontrado"

    try:
        data_agendamento = parse_data_iso(data_iso)
    except Exception:
        return None, "Formato de data inválido"

    novo_agendamento = Agendamento(
        data=data_agendamento,
        tipo_doacao=tipo_doacao,
        doador_id=doador_id,
        hemocentro_id=hemocentro_id,
        status="agendado"
    )

    db.session.add(novo_agendamento)
    db.session.commit()

    return novo_agendamento, None


def listar_agendamentos_doador(doador_id):
    agendamentos = Agendamento.query.filter_by(
        doador_id=doador_id
    ).order_by(Agendamento.data.desc()).all()

    saida = []
    for ag in agendamentos:
        horario_funcionamento = None
        if ag.hemocentro:
            horario_funcionamento = f"{ag.hemocentro.horario_inicio} - {ag.hemocentro.horario_fim}"

        saida.append({
            'id': ag.id,
            'data': ag.data.strftime('%d/%m/%Y') if ag.data else None,
            'status': ag.status,
            'tipo_doacao': ag.tipo_doacao,
            'hemocentro_nome': ag.hemocentro.nome_instituicao if ag.hemocentro else 'Hemocentro não encontrado',
            'hemocentro_endereco': f"{ag.hemocentro.logradouro}, {ag.hemocentro.numero}" if ag.hemocentro else '',
            'horario_funcionamento': horario_funcionamento
        })
    return saida


def montar_carteira(doador_id):
    doador = Doador.query.get(doador_id)
    if not doador:
        return None, "Doador não encontrado"

    agendamentos = Agendamento.query.filter_by(doador_id=doador_id).all()

    doacoes_realizadas = len([a for a in agendamentos if a.status == 'realizado'])
    volume_total = doacoes_realizadas * 450
    vidas_salvas = doacoes_realizadas * 3

    if doacoes_realizadas >= 10:
        categoria = "Diamante"
    elif doacoes_realizadas >= 5:
        categoria = "Ouro"
    elif doacoes_realizadas >= 3:
        categoria = "Prata"
    else:
        categoria = "Bronze"

    ultima_realizada = Agendamento.query.filter_by(
        doador_id=doador_id,
        status='realizado'
    ).order_by(Agendamento.data.desc()).first()

    proxima_doacao = None
    if ultima_realizada and ultima_realizada.data:
        proxima_doacao = ultima_realizada.data + timedelta(days=90)

    carteira = {
        'id': doador.id,
        'nome': doador.nome,
        'cpf': doador.cpf,
        'data_nascimento': doador.data_nascimento.strftime('%d/%m/%Y') if doador.data_nascimento else None,
        'tipo_sanguineo': doador.tipo_sanguineo,
        'fator_rh': 'Positivo (+)' if '+' in doador.tipo_sanguineo else 'Negativo (-)',
        'telefone': doador.telefone,
        'email': doador.email,
        'data_cadastro': doador.data_criacao.strftime('%d/%m/%Y') if doador.data_criacao else None,
        'ultima_doacao': ultima_realizada.data.strftime('%d/%m/%Y') if ultima_realizada else 'Nenhuma',
        'proxima_doacao': proxima_doacao.strftime('%d/%m/%Y') if proxima_doacao else 'Indisponível',
        'status_doacao': 'Elegível' if not proxima_doacao or proxima_doacao <= datetime.now().date() else 'Aguardando período',
        'categoria': categoria,
        'estatisticas': {
            'doacoes_realizadas': doacoes_realizadas,
            'volume_total_ml': volume_total,
            'vidas_salvas': vidas_salvas,
            'categoria': categoria
        }
    }

    return carteira, None


def listar_campanhas_publicas():
    campanhas = Campanha.query.filter(
        Campanha.status.in_(["ativa", "urgente"])
    ).order_by(Campanha.data_criacao.desc()).all()

    saida = []
    for c in campanhas:
        saida.append({
            'id': c.id,
            'titulo': c.titulo,
            'descricao': c.descricao,
            'local': c.local,
            'data_inicio': c.data_inicio.strftime('%Y-%m-%d') if c.data_inicio else None,
            'data_fim': c.data_fim.strftime('%Y-%m-%d') if c.data_fim else None,
            'status': c.status,
            'data_criacao': c.data_criacao.strftime('%Y-%m-%d') if c.data_criacao else None
        })
    return saida


def cancelar_agendamento(doador_id, agendamento_id):
    agendamento = Agendamento.query.get(agendamento_id)
    if not agendamento:
        return None, "Agendamento não encontrado"

    if agendamento.doador_id != doador_id:
        return None, "Você não tem permissão para cancelar este agendamento"

    if agendamento.status in ["realizado", "cancelado"]:
        return None, "Este agendamento não pode ser cancelado"

    agendamento.status = "cancelado"
    db.session.commit()
    return agendamento, None