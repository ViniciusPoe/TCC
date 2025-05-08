from aplicacao import criar_app

app = criar_app()

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8000)