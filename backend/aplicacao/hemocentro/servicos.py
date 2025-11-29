from datetime import datetime, timedelta, date
from aplicacao.core.database import db
from aplicacao.models import Hemocentro, Agendamento, Doador, Doacao, Campanha
from aplicacao.utils.helpers import parse_data_iso, parse_horario, proxima_doacao_a_partir, is_apto_para_doar

def montar_perfil_hemocentro(hemocentro: Hemocentro):
    """
    Retorna os dados completos do hemocentro, incluindo informações
    cadastrais e estatísticas de painel.
    """
    total_agendamentos = Agendamento.query.filter_by(hemocentro_id=hemocentro.id).count()
    agendamentos_hoje = Agendamento.query.filter(
        Agendamento.hemocentro_id == hemocentro.id,
        Agendamento.data == datetime.now().date()
    ).count()
    doacoes_realizadas = Doacao.query.filter_by(hemocentro_id=hemocentro.id).count()

    return {
        "id": hemocentro.id,
        "nome_instituicao": hemocentro.nome_instituicao,
        "cnpj": hemocentro.cnpj,
        "email": hemocentro.email,
        "telefone": hemocentro.telefone,
        "logradouro": hemocentro.logradouro,
        "numero": hemocentro.numero,
        "complemento": hemocentro.complemento,
        "cidade": hemocentro.cidade,
        "estado": hemocentro.estado,
        "cep": hemocentro.cep,

        "horario_inicio": hemocentro.horario_inicio,
        "horario_fim": hemocentro.horario_fim,

        "total_agendamentos": total_agendamentos,
        "agendamentos_hoje": agendamentos_hoje,
        "doacoes_realizadas": doacoes_realizadas,
    }


def listar_agendamentos_hemocentro(hemocentro_id):
    agendamentos = Agendamento.query.filter_by(
        hemocentro_id=hemocentro_id
    ).order_by(Agendamento.data.desc()).all()

    saida = []
    for ag in agendamentos:
        saida.append({
            'id': ag.id,
            'data': ag.data.strftime('%d/%m/%Y') if ag.data else None,
            'status': ag.status,
            'tipo_doacao': ag.tipo_doacao,
            'doador_nome': ag.doador.nome if ag.doador else 'Doador não encontrado',
            'doador_email': ag.doador.email if ag.doador else '',
            'doador_telefone': ag.doador.telefone if ag.doador else '',
            'doador_tipo_sanguineo': ag.doador.tipo_sanguineo if ag.doador else ''
        })
    return saida


def reagendar_agendamento(hemocentro_id, agendamento_id, dados):
    ag = Agendamento.query.get(agendamento_id)
    if not ag:
        return None, "Agendamento não encontrado"

    if ag.hemocentro_id != hemocentro_id:
        return None, "Você não tem permissão para reagendar este agendamento"

    if dados.get('data'):
        ag.data = parse_data_iso(dados['data'])
    if dados.get('horario'):
        ag.horario = dados['horario']

    db.session.commit()
    return ag, None


def listar_doadores_com_info(hemocentro_id):
    """
    Lista TODOS os doadores do sistema.
    (⚠️ Em produção, recomendável filtrar só doadores que já têm relação com esse hemocentro.)
    """
    doadores = Doador.query.all()

    lista = []
    for d in doadores:
        ultima_doacao = Doacao.query.filter_by(
            doador_id=d.id
        ).order_by(Doacao.data_doacao.desc()).first()

        proxima = None
        apto = True
        if ultima_doacao and ultima_doacao.data_doacao:
            proxima = ultima_doacao.data_doacao + timedelta(days=90)
            if proxima > datetime.now().date():
                apto = False

        um_ano_atras = datetime.now().date() - timedelta(days=365)
        doacoes_ultimo_ano = Doacao.query.filter(
            Doacao.doador_id == d.id,
            Doacao.data_doacao >= um_ano_atras
        ).count()

        if doacoes_ultimo_ano >= 3:
            frequencia = 'Frequente'
        elif doacoes_ultimo_ano == 0:
            frequencia = 'Novo'
        else:
            frequencia = 'Ocasional'

        lista.append({
            'id': d.id,
            'nome': d.nome,
            'email': d.email,
            'telefone': d.telefone,
            'tipo_sanguineo': d.tipo_sanguineo,
            'data_nascimento': d.data_nascimento.strftime('%d/%m/%Y') if d.data_nascimento else None,
            'ultima_doacao': ultima_doacao.data_doacao.strftime('%d/%m/%Y') if ultima_doacao else 'Nunca doou',
            'proxima_doacao': proxima.strftime('%d/%m/%Y') if proxima else 'Pode doar agora',
            'apto': apto,
            'frequencia': frequencia
        })

    total = len(lista)
    aptos = len([d for d in lista if d['apto']])
    inaptos = len([d for d in lista if not d['apto']])

    return {
        'doadores': lista,
        'total': total,
        'aptos': aptos,
        'inaptos': inaptos
    }


def listar_doacoes(hemocentro_id):
    doacoes = Doacao.query.filter_by(hemocentro_id=hemocentro_id).all()
    saida = []
    for d in doacoes:
        saida.append({
            'id': d.id,
            'data': d.data_doacao.strftime('%d/%m/%Y') if d.data_doacao else None,
            'horario': d.horario,
            'doador_nome': d.doador.nome if d.doador else 'N/A',
            
            'tipo_sanguineo': d.doador.tipo_sanguineo if hasattr(d, 'doador') and d.doador else 'N/A',
            
            'tipo_doacao': d.tipo_doacao,
            'volume': d.volume,
            'hemoglobina': getattr(d, 'hemoglobina', None),
            'pressao_arterial': getattr(d, 'pressao_arterial', None),
            'status': d.status or "realizada"
        })
    return saida


def listar_doadores_com_agendamento(hemocentro_id):
    ags = Agendamento.query.filter_by(
        hemocentro_id=hemocentro_id,
        status='pendente'     # 👈 em vez de 'agendado'
    ).all()

    lista = []
    for ag in ags:
        d = ag.doador
        lista.append({
            'id': d.id,
            'nome': d.nome,
            'tipo_sanguineo': d.tipo_sanguineo,
            'email': d.email,
            'telefone': d.telefone,
            'data_agendamento': ag.data.strftime('%d/%m/%Y'),
            'tipo_doacao_agendada': ag.tipo_doacao,
            'agendamento_id': ag.id
        })
    return lista


def registrar_doacao(hemocentro_id, dados):
    try:
        doador_id = int(dados["doador_id"])

        data_doacao = parse_data_iso(dados["data_doacao"])

        existente = Doacao.query.filter_by(
            doador_id=doador_id,
            hemocentro_id=hemocentro_id,
            data_doacao=data_doacao
        ).first()

        if existente:
            print("⚠️ Doação já registrada para este doador nesta data.")
        else:
            peso_valor = dados.get("peso")
            peso_float = (
                float(peso_valor)
                if peso_valor is not None and str(peso_valor).strip() not in ("", "None", "null")
                else None
            )

            temp_valor = dados.get("temperatura")
            temp_float = (
                float(temp_valor)
                if temp_valor is not None and str(temp_valor).strip() not in ("", "None", "null")
                else None
            )

            nova = Doacao(
                doador_id=doador_id,
                hemocentro_id=hemocentro_id,
                volume=dados.get("volume", 450),
                tipo_doacao=dados.get("tipo_doacao", "sangue_total"),
                data_doacao=data_doacao,
                horario=parse_horario(dados.get("horario")),
                hemoglobina=dados.get("hemoglobina"),
                pressao_arterial=dados.get("pressao_arterial"),
                peso=peso_float,
                temperatura=temp_float,
                observacoes=dados.get("observacoes", ""),
                status="realizada"
            )
            db.session.add(nova)
            print(f"✅ Doação criada: ID {nova.id if hasattr(nova, 'id') else 'pendente commit'}")
        
        agendamento = (
            Agendamento.query
            .filter(
                Agendamento.doador_id == doador_id,
                Agendamento.hemocentro_id == hemocentro_id,
                Agendamento.status == "pendente"   # 👈 antes: "agendado"
            )
            .order_by(Agendamento.data.desc())
            .first()
            )

        if agendamento:
            agendamento.status = "realizado"      # 👈 antes: "concluido"
            agendamento.data_realizacao = datetime.now()
            print(f"🩸 Agendamento {agendamento.id} marcado como realizado.")
        else:
            print(
                f"⚠️ Nenhum agendamento 'pendente' encontrado para doador {doador_id} "
                f"no hemocentro {hemocentro_id}."
            )

        doador = Doador.query.get(doador_id)
        if doador:
            doador.ultima_doacao = data_doacao
            print(f"🧬 Atualizada última doação do doador {doador.nome}.")

        db.session.commit()
        print("✅ Commit executado com sucesso.")

        return existente if existente else nova

    except Exception as e:
        import traceback
        db.session.rollback()
        print("❌ Erro ao registrar doação:")
        traceback.print_exc()
        return None


def info_hemocentro(hemocentro_id):
    hemo = Hemocentro.query.get(hemocentro_id)
    if not hemo:
        return None, "Nenhum hemocentro encontrado"
    return {
        'nome_instituicao': hemo.nome_instituicao,
        'cidade': hemo.cidade,
        'estado': hemo.estado,
        'logradouro': hemo.logradouro,
        'numero': hemo.numero,
        'telefone': hemo.telefone,
        'email': hemo.email,
        'horario_funcionamento': hemo.horario_funcionamento
    }, None


def listar_campanhas_hemocentro(hemocentro_id):
    campanhas = Campanha.query.filter_by(
        hemocentro_id=hemocentro_id
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
            'data_criacao': c.data_criacao.strftime('%Y-%m-%d') if c.data_criacao else None,
            'participantes': c.participantes,
            'hemocentro_id': c.hemocentro_id
        })
    return saida


def criar_campanha(hemocentro_id, dados):
    data_inicio = parse_data_iso(dados.get("dataInicio"))
    data_fim = parse_data_iso(dados.get("dataFim"))

    nova = Campanha(
        titulo=dados.get("titulo"),
        descricao=dados.get("descricao"),
        local=dados.get("local", "Hemocentro"),
        data_inicio=data_inicio,
        data_fim=data_fim,
        status=dados.get("status", "ativa"),
        participantes=0,
        hemocentro_id=hemocentro_id
    )
    db.session.add(nova)
    db.session.commit()
    return nova


def editar_campanha(hemocentro_id, campanha_id, dados):
    camp = Campanha.query.get(campanha_id)
    if not camp:
        return None, "Campanha não encontrada"
    if camp.hemocentro_id != hemocentro_id:
        return None, "Você não tem permissão para editar esta campanha"

    camp.titulo = dados['titulo']
    camp.descricao = dados['descricao']
    camp.data_inicio = parse_data_iso(dados['dataInicio'])
    camp.data_fim = parse_data_iso(dados['dataFim'])
    camp.status = dados.get('status', 'ativa')

    db.session.commit()
    return camp, None


def excluir_campanha(hemocentro_id, campanha_id):
    camp = Campanha.query.get(campanha_id)
    if not camp:
        return None, "Campanha não encontrada"
    if camp.hemocentro_id != hemocentro_id:
        return None, "Você não tem permissão para excluir esta campanha"

    db.session.delete(camp)
    db.session.commit()
    return True, None

def concluir_campanha(hemocentro_id, campanha_id):
    camp = Campanha.query.get(campanha_id)
    if not camp:
        return False, "Campanha não encontrada", None
    if camp.hemocentro_id != hemocentro_id:
        return False, "Você não tem permissão para concluir esta campanha", None

    camp.status = "concluida"
    db.session.commit()
    return True, None, camp

def atualizar_campanhas_expiradas(hemocentro_id):
    """Marca como concluída todas as campanhas com data_fim < hoje e status != 'concluida'."""
    hoje = date.today()

    query = Campanha.query.filter(
        Campanha.data_fim < hoje,
        Campanha.status != 'concluida'
    )

    if hemocentro_id is not None:
        query = query.filter(Campanha.hemocentro_id == hemocentro_id)

    campanhas_expiradas = query.all()

    if not campanhas_expiradas:
        return 0

    for campanha in campanhas_expiradas:
        campanha.status = 'concluida'

    db.session.commit()
    return len(campanhas_expiradas)

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
            "id": doacao.id,
            "data": doacao.data_doacao.strftime("%d/%m/%Y") if doacao.data_doacao else None,
            "horario": doacao.horario.strftime("%H:%M") if doacao.horario else None,
            "local": doacao.hemocentro.nome_instituicao if doacao.hemocentro else "Hemocentro",
            "volume": doacao.volume,
            "tipo_doacao": doacao.tipo_doacao,
            "hemoglobina": doacao.hemoglobina,
            "pressao_arterial": doacao.pressao_arterial,
            "status": doacao.status,
        })
    return lista

