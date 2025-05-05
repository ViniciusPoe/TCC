from flask import Blueprint, render_template

bp_instituicao = Blueprint('instituicao', __name__)

@bp_instituicao.route('/')
def painel():
    return render_template('instituicao/painel.html')

@bp_instituicao.route('/estoque')
def estoque():
    return render_template('instituicao/estoque.html')

@bp_instituicao.route('/donatario')
def donatario():
    return render_template('instituicao/donatario.html')

@bp_instituicao.route('/doadores')
def doadores():
    return render_template('instituicao/doadores.html')

@bp_instituicao.route('/validacao')
def validacao():
    return render_template('instituicao/validacao.html')