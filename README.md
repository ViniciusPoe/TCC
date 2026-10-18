# HemoSys — Sistema de Doação de Sangue

Plataforma web (TCC) que conecta **doadores** e **hemocentros**: o doador agenda
doações, acompanha o histórico e emite a carteira de doador; o hemocentro gerencia
agendamentos, registra doações e divulga campanhas.

## Funcionalidades

**Doador**
- Cadastro e login por CPF
- Agendamento e cancelamento de doações em hemocentros
- Histórico de doações e carteira de doador
- Consulta de campanhas ativas
- Edição de perfil e troca de senha

**Hemocentro**
- Cadastro e login por CNPJ
- Agenda de doações (com reagendamento)
- Registro de doações realizadas (dados da triagem)
- Lista de doadores e doadores com agendamento
- Criação, edição, conclusão e exclusão de campanhas
- Edição de perfil e troca de senha

## Tecnologias

| Camada | Stack |
|---|---|
| Frontend | React 18, React Router 6, Bootstrap 5 |
| Backend | Python, Flask 3, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-Bcrypt, Flask-CORS, Flask-Limiter |
| Banco de dados | MySQL (local) ou PostgreSQL via `SQLALCHEMY_DATABASE_URI` |
| Deploy | Render (`gunicorn app:app`) |

## Estrutura

```
backend/
  app.py                 # ponto de entrada
  inicializar.py         # recria as tabelas (APAGA os dados)
  aplicacao/
    config.py            # configuração lida de variáveis de ambiente
    models.py            # Doador, Hemocentro, Agendamento, Doacao, Campanha
    autenticacao/        # login, cadastro, perfil, troca de senha
    doador/              # rotas e serviços do doador
    hemocentro/          # rotas e serviços do hemocentro
    core/                # banco, segurança (JWT, bcrypt, limiter), logging
frontend/
  src/
    pages/               # Home, auth, doador, hemocentro
    components/          # navegação e componentes compartilhados
    services/api.js      # cliente HTTP
    routes/              # rotas protegidas
```

## Como rodar localmente

### Pré-requisitos
Python 3.11+, Node.js 18+ e um MySQL com um banco criado (ex.: `doacao_sangue`).

### Backend
```bash
cd backend
python -m venv venv && venv\Scripts\activate   # Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                           # preencha os valores (veja abaixo)
python app.py                                  # http://localhost:5000
```
As tabelas são criadas automaticamente na primeira execução.

### Frontend
```bash
cd frontend
npm install
echo REACT_APP_API_URL=http://localhost:5000 > .env.local
npm start                                      # http://localhost:3000
```

## Variáveis de ambiente (backend)

O app **não inicia** sem as variáveis obrigatórias.

| Variável | Obrigatória | Descrição |
|---|---|---|
| `SECRET_KEY` | sim | Chave do Flask. |
| `JWT_SECRET_KEY` | sim | Chave de assinatura dos tokens JWT. |
| `SQLALCHEMY_DATABASE_URI` | uma das duas opções | URI completa do banco (use em produção). |
| `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_HOST` | alternativa à URI | Montam a URI do MySQL (`DB_HOST` padrão: `localhost`). |
| `FLASK_DEBUG` | não | `True` apenas em desenvolvimento. Padrão: `False`. |
| `JWT_EXPIRES_HOURS` | não | Validade do token. Padrão: `8`. |
| `CORS_ORIGINS` | não | Origens permitidas, separadas por vírgula. |

Gere chaves fortes com:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

## API (resumo)

| Área | Endpoints principais |
|---|---|
| Autenticação | `POST /api/login/doador`, `POST /api/login/hemocentro`, `POST /api/cadastro/doador`, `POST /api/cadastro/hemocentro`, `PUT /api/alterar_senha`, `GET /api/check-auth` |
| Doador (`/doador`) | `/api/perfil`, `/api/historico`, `/api/hemocentros`, `/api/agendamento`, `/api/agendamentos/doador`, `/api/campanhas`, `/api/carteira` |
| Hemocentro (`/hemocentro`) | `/api/perfil`, `/api/agendamentos/hemocentro`, `/api/doadores`, `/api/doacoes`, `/api/registrar-doacao`, `/api/campanhas` |

As rotas protegidas exigem o cabeçalho `Authorization: Bearer <token>`.

## Segurança

- Senhas armazenadas com bcrypt; autenticação por JWT com expiração configurável.
- Limite de tentativas nas rotas de login (10 por minuto e 100 por hora, por IP).
- CORS restrito às origens configuradas.
- Segredos e credenciais lidos somente de variáveis de ambiente — nunca versione o `.env`.
- Logs não registram senhas nem dados pessoais das requisições.

## Observações

- O limite de tentativas fica em memória: com vários workers do gunicorn, vale por worker.
- `python inicializar.py` apaga e recria todas as tabelas. Use apenas em desenvolvimento.

## Autor

Vinicius Poe — [@ViniciusPoe](https://github.com/ViniciusPoe)
