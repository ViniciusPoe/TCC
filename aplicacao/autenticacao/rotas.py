from flask import Blueprint, render_template, redirect, url_for, request

bp_autenticacao = Blueprint('autenticacao', __name__)

# Página inicial de login e cadastro
@bp_autenticacao.route('/login', methods=['GET', 'POST'])
def login():
    return render_template('autenticacao/login_cadastro.html')

# Páginas de login para doador e instituição
@bp_autenticacao.route('/login/doador', methods=['GET', 'POST'])
def login_doador():
    return render_template('autenticacao/login_doador.html')

@bp_autenticacao.route('/login/instituicao', methods=['GET', 'POST'])
def login_instituicao():
    return render_template('autenticacao/login_instituicao.html')

# Páginas de cadastro para doador e instituição
@bp_autenticacao.route('/cadastro/doador', methods=['GET', 'POST'])
def cadastro_doador():
    return render_template('autenticacao/cadastro_doador.html')

@bp_autenticacao.route('/cadastro/instituicao', methods=['GET', 'POST'])
def cadastro_instituicao():
    return render_template('autenticacao/cadastro_instituicao.html')

@bp_autenticacao.route('/')
def redirecionar_para_login():
    return redirect(url_for('autenticacao.login'))
