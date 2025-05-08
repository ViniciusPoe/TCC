from aplicacao import criar_app

app = criar_app()
application = app

if __name__ == '__main__':
    app.run(debug=True)