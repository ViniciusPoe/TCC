from flask import jsonify

def success_response(message="Operação realizada com sucesso", data=None, code=200):
    """
    Retorna resposta JSON padronizada para sucesso.
    """
    response = {
        "success": True,
        "message": message
    }

    if data is not None:
        response["data"] = data

    return jsonify(response), code


def error_response(message="Ocorreu um erro", code=400):
    """
    Retorna resposta JSON padronizada para erro.
    """
    response = {
        "success": False,
        "message": message
    }
    return jsonify(response), code
