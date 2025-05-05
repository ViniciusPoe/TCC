from ..banco_dados import db

class Doador(db.Model):
    __tablename__ = 'doadores'
    
    id = db.Column(db.Integer, chave_primaria=True)
    nome = db.Column(db.String(100))
    tipo_sanguineo = db.Column(db.String(3))
    ultima_doacao = db.Column(db.Date)
    carteira_doador = db.Column(db.String(50), unico=True)
    
    agendamentos = db.relationship('Agendamento', backref='doador', lazy=True)

class Agendamento(db.Model):
    __tablename__ = 'agendamentos'
    
    id = db.Column(db.Integer, chave_primaria=True)
    data = db.Column(db.DateTime)
    status = db.Column(db.String(20))  # 'agendado', 'cancelado', 'realizado'
    doador_id = db.Column(db.Integer, db.ForeignKey('doadores.id'))
    local_id = db.Column(db.Integer, db.ForeignKey('hemocentros.id'))