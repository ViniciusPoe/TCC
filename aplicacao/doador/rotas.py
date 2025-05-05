from flask import Blueprint, render_template

bp_doador = Blueprint('doador', __name__)

@bp_doador.route('/')
def painel():
    dados_doador = {
        'nome': 'João Silva',
        'tipo_sanguineo': 'O+',
        'ultima_doacao': '15/03/2023',
        'proxima_doacao_possivel': '15/09/2023'
    }
    noticias = [
        "Como a Doação de Sangue Salva Vidas",
        "A Importância do Tipo Sanguíneo",
        "O Impacto das Doações Regulares de Sangue",
        "Transfusões de Sangue e a Medicina Moderna",
        "Como se Preparar para uma Doação de Sangue",
        "Sangue para Emergências: Como Funciona"
    ]
    return render_template('doador/painel.html', doador=dados_doador, noticias=noticias)

@bp_doador.route('/historico')
def historico():
    doacoes = [
        {'data': '01/01/2023', 'local': 'Hemocentro X'},
        {'data': '15/03/2023', 'local': 'Hospital Y'}
    ]
    return render_template('doador/historico.html', doacoes=doacoes)

@bp_doador.route('/agendamento', methods=['GET', 'POST'])
def agendamento():
    apto = True  # Defina se o doador está apto ou não para doar
    return render_template('doador/agendamento.html', apto=apto)

@bp_doador.route('/hemocentros')
def hemocentros():
    hemocentros = [
        {'nome': 'Hemocentro X', 'distancia_km': 2},
        {'nome': 'Hemocentro Y', 'distancia_km': 5},
        {'nome': 'Hemocentro Z', 'distancia_km': 10}
    ]
    return render_template('doador/hemocentros.html', hemocentros=hemocentros)
