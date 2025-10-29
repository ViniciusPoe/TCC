def validar_campos_obrigatorios(data, campos):
    faltando = [c for c in campos if not data.get(c)]
    if faltando:
        return f"Campos obrigatórios faltando: {', '.join(faltando)}"
    return None
