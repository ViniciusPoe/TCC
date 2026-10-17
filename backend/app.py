from aplicacao import criar_app

app = criar_app()

if __name__ == '__main__':
    app.run(debug=app.config["DEBUG"], port=5000)
