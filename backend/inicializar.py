from aplicacao import criar_app
from aplicacao.core.database import db

app = criar_app()

with app.app_context():
    confirm = input("⚠️  Isso vai apagar TODOS os dados. Continuar? (s/N): ").lower()
    if confirm == 's':
        print("Dropando todas as tabelas...")
        db.drop_all()
        print("Criando novamente...")
        db.create_all()
        print("✅ Pronto.")
    else:
        print("Operação cancelada.")
