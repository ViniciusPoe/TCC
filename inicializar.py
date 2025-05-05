from aplicacao import criar_app, banco_dados

app = criar_app()

with app.app_context():
    banco_dados.create_all()
    print("✅ Tabelas criadas com sucesso!")