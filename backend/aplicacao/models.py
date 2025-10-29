from datetime import datetime, date
from aplicacao.core.database import db
from aplicacao.core.security import bcrypt

class Doador(db.Model):
    __tablename__ = "doadores"

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    cpf = db.Column(db.String(14), unique=True, nullable=False)
    rg = db.Column(db.String(20), unique=True, nullable=False)

    data_nascimento = db.Column(db.Date, nullable=False)
    sexo = db.Column(db.String(10), nullable=False)
    tipo_sanguineo = db.Column(db.String(5), nullable=False)

    telefone = db.Column(db.String(20), nullable=False)

    cep = db.Column(db.String(10), nullable=False)
    logradouro = db.Column(db.String(120), nullable=False)
    numero = db.Column(db.String(20), nullable=False)
    complemento = db.Column(db.String(120))
    bairro = db.Column(db.String(80), nullable=False)
    cidade = db.Column(db.String(80), nullable=False)
    estado = db.Column(db.String(2), nullable=False)

    peso = db.Column(db.Float, nullable=False)
    altura = db.Column(db.Integer, nullable=False)

    senha_hash = db.Column(db.String(255), nullable=False)
    data_cadastro = db.Column(db.DateTime, default=datetime.utcnow)

    # 🩸 Campos de doação
    ultima_doacao_tipo = db.Column(db.String(20), nullable=False)  # ← ADICIONE ESTE CAMPO
    ultima_doacao = db.Column(db.Date, nullable=True)
    proxima_doacao = db.Column(db.Date, nullable=True)
    
    # ==========================
    # 🔐 Métodos de autenticação
    # ==========================
    def set_senha(self, senha_plana: str):
        """Gera o hash seguro da senha."""
        self.senha_hash = bcrypt.generate_password_hash(senha_plana).decode("utf-8")

    def verificar_senha(self, senha_plana: str) -> bool:
        """Compara a senha informada com o hash salvo."""
        return bcrypt.check_password_hash(self.senha_hash, senha_plana)
    

class Hemocentro(db.Model):
    __tablename__ = "hemocentros"

    id = db.Column(db.Integer, primary_key=True)

    nome_instituicao = db.Column(db.String(150), nullable=False)
    cnpj = db.Column(db.String(18), unique=True, nullable=False)

    logradouro = db.Column(db.String(120), nullable=False)
    numero = db.Column(db.String(20), nullable=False)
    complemento = db.Column(db.String(120))
    cidade = db.Column(db.String(80), nullable=False)
    estado = db.Column(db.String(2), nullable=False)
    cep = db.Column(db.String(10), nullable=False)

    # 🕒 Horário de funcionamento dividido
    horario_inicio = db.Column(db.String(5), nullable=False)  # Ex: "08:00"
    horario_fim = db.Column(db.String(5), nullable=False)      # Ex: "16:00"

    email = db.Column(db.String(120), unique=True, nullable=False)
    telefone = db.Column(db.String(20), nullable=False)

    senha_hash = db.Column(db.String(255), nullable=False)

    # 🗓️ Registro de criação
    data_cadastro = db.Column(db.DateTime, default=datetime.utcnow)

    # ==========================
    # 🔐 Métodos de autenticação
    # ==========================
    def set_senha(self, senha_plana: str):
        self.senha_hash = bcrypt.generate_password_hash(senha_plana).decode("utf-8")

    def verificar_senha(self, senha_plana: str) -> bool:
        return bcrypt.check_password_hash(self.senha_hash, senha_plana)


class Agendamento(db.Model):
    __tablename__ = 'agendamentos'
    
    id = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.Date, nullable=False)
    horario = db.Column(db.String(8))  # "HH:MM"
    status = db.Column(db.String(20), default='agendado')
    tipo_doacao = db.Column(db.String(20), default='sangue_total')
    doador_id = db.Column(db.Integer, db.ForeignKey('doadores.id'), nullable=False)
    hemocentro_id = db.Column(db.Integer, db.ForeignKey('hemocentros.id'), nullable=False)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    data_cancelamento = db.Column(db.DateTime, nullable=True)

    # 🩸 Relacionamentos
    doador = db.relationship("Doador", backref="agendamentos", lazy=True)
    hemocentro = db.relationship("Hemocentro", backref="agendamentos", lazy=True)

    def __repr__(self):
        return f'<Agendamento {self.id}>'

class Doacao(db.Model):
    __tablename__ = 'doacoes'
    
    id = db.Column(db.Integer, primary_key=True)
    doador_id = db.Column(db.Integer, db.ForeignKey('doadores.id'), nullable=False)
    hemocentro_id = db.Column(db.Integer, db.ForeignKey('hemocentros.id'), nullable=False)
    volume = db.Column(db.Integer, nullable=False)
    tipo_doacao = db.Column(db.String(20), nullable=False)
    data_doacao = db.Column(db.Date, nullable=False)
    horario = db.Column(db.Time)
    hemoglobina = db.Column(db.String(10))
    pressao_arterial = db.Column(db.String(20))
    peso = db.Column(db.Float)
    temperatura = db.Column(db.Float)
    observacoes = db.Column(db.Text)
    status = db.Column(db.String(20), default='realizada')
    data_registro = db.Column(db.DateTime, default=datetime.utcnow)

    doador = db.relationship(
        'Doador',
        backref=db.backref('minhas_doacoes', lazy=True)
    )
    hemocentro = db.relationship(
        'Hemocentro',
        backref=db.backref('suas_doacoes', lazy=True)
    )

    def __repr__(self):
        return f'<Doacao {self.id}>'


class Campanha(db.Model):
    __tablename__ = 'campanhas'
    
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    descricao = db.Column(db.Text, nullable=False)
    local = db.Column(db.String(200), nullable=False)
    data_inicio = db.Column(db.Date, nullable=False)
    data_fim = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), default='ativa')  # ativa, urgente, concluida
    participantes = db.Column(db.Integer, default=0)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    hemocentro_id = db.Column(db.Integer, db.ForeignKey('hemocentros.id'), nullable=False)

    def __repr__(self):
        return f'<Campanha {self.titulo}>'
