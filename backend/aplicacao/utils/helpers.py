from datetime import datetime, timedelta, date


def parse_data_iso(data_str):
    """
    Converte uma string de data ISO (YYYY-MM-DD) para datetime.date.
    Retorna None se o formato for inválido ou nulo.
    """
    if not data_str:
        return None
    try:
        return datetime.strptime(data_str, "%Y-%m-%d").date()
    except ValueError:
        try:
            # fallback caso venha com hora
            return datetime.fromisoformat(data_str).date()
        except Exception:
            print(f"⚠️ parse_data_iso: formato inválido -> {data_str}")
            return None

def parse_horario(hora_str):
    """Converte 'HH:MM' -> time"""
    return datetime.strptime(hora_str, '%H:%M').time()

def calcula_idade(data_nascimento: date) -> int:
    hoje = date.today()
    return hoje.year - data_nascimento.year - (
        (hoje.month, hoje.day) < (data_nascimento.month, data_nascimento.day)
    )

def proxima_doacao_a_partir(data_ultima: date):
    if not data_ultima:
        return None
    return data_ultima + timedelta(days=90)

def is_apto_para_doar(ultima_doacao: date):
    """Retorna True se já pode doar de novo (>=90 dias)"""
    if not ultima_doacao:
        return True
    return proxima_doacao_a_partir(ultima_doacao) <= date.today()
