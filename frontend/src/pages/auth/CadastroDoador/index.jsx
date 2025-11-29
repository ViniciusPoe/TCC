import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../services/api";
import "./styles.css";

const CadastroDoador = () => {
  const [formData, setFormData] = useState({
    nome: "",
    data_nascimento: "",
    cpf: "",
    rg: "",
    sexo: "",
    tipo_sanguineo: "",
    email: "",
    telefone: "",
    cep: "",
    cidade: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    estado: "",
    peso: "",
    altura: "",
    senha: "",
    confirmar_senha: "",
    ultima_doacao_tipo: "",
    ultima_doacao: "",
    proxima_doacao: "",
    termos: false,
  });

  const [error, setError] = useState("");
  useEffect(() => {
    if (formData.ultima_doacao_tipo === "nunca") {
      setFormData((prev) => ({
        ...prev,
        ultima_doacao: "",
        proxima_doacao: "",
      }));
      return;
    }

    if (
      formData.ultima_doacao_tipo === "doador" &&
      (!formData.ultima_doacao || formData.ultima_doacao === "0000-00-00")
    ) {
      setFormData((prev) => ({
        ...prev,
        proxima_doacao: "",
      }));
      return;
    }

    if (formData.ultima_doacao_tipo === "doador" && formData.ultima_doacao) {
      const dataUltima = new Date(formData.ultima_doacao);

      if (!isNaN(dataUltima.getTime())) {
        const dataProxima = new Date(dataUltima);
        dataProxima.setDate(dataUltima.getDate() + 90);

        const formatada = dataProxima.toISOString().split("T")[0];
        setFormData((prev) => ({ ...prev, proxima_doacao: formatada }));
      } else {
        setFormData((prev) => ({ ...prev, proxima_doacao: "" }));
      }
    }
  }, [formData.ultima_doacao, formData.ultima_doacao_tipo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.senha !== formData.confirmar_senha) {
      setError("As senhas não coincidem");
      return;
    }

    if (!formData.termos) {
      setError("Você deve aceitar os termos e condições");
      return;
    }
    const dadosParaEnvio = {
      ...formData,
      confirmar_senha: undefined,
      termos: undefined,
      ultima_doacao:
        formData.ultima_doacao_tipo === "doador"
          ? formData.ultima_doacao
          : null,
      proxima_doacao:
        formData.ultima_doacao_tipo === "doador"
          ? formData.proxima_doacao
          : null,
    };

    try {
      const response = await api.cadastroDoador(dadosParaEnvio);
      if (response.success) {
        alert("Cadastro realizado com sucesso!");
        window.location.href = "/login/doador";
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError("Erro ao conectar com o servidor");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    <div className="cadastro-page">
      <div className="cadastro-card">
        <h2 className="text-center text-danger mb-4">
          Cadastro de Doador de Sangue
        </h2>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <h5 className="text-danger">Dados Pessoais</h5>
            <div className="row">
              <div className="col-md-8 mb-3">
                <label className="form-label">Nome Completo *</label>
                <input
                  type="text"
                  className="form-control"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Data de Nascimento *</label>
                <input
                  type="date"
                  className="form-control"
                  name="data_nascimento"
                  value={formData.data_nascimento}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">CPF *</label>
                <input
                  type="text"
                  className="form-control"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">RG *</label>
                <input
                  type="text"
                  className="form-control"
                  name="rg"
                  value={formData.rg}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Sexo *</label>
                <select
                  className="form-control"
                  name="sexo"
                  value={formData.sexo}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Selecione</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="O">Outro</option>
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Tipo Sanguíneo *</label>
                <select
                  className="form-control"
                  name="tipo_sanguineo"
                  value={formData.tipo_sanguineo}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Selecione</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h5 className="text-danger">Informações de Contato</h5>
            <div className="mb-3">
              <label className="form-label">E-mail *</label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Telefone *</label>
                <input
                  type="tel"
                  className="form-control"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>
          <div className="mb-4">
            <h5 className="text-danger">Endereço</h5>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">CEP *</label>
                <input
                  type="text"
                  className="form-control"
                  name="cep"
                  value={formData.cep}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Cidade *</label>
                <input
                  type="text"
                  className="form-control"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-8 mb-3">
                <label className="form-label">Logradouro *</label>
                <input
                  type="text"
                  className="form-control"
                  name="logradouro"
                  value={formData.logradouro}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Número *</label>
                <input
                  type="text"
                  className="form-control"
                  name="numero"
                  value={formData.numero}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Complemento</label>
              <input
                type="text"
                className="form-control"
                name="complemento"
                value={formData.complemento}
                onChange={handleInputChange}
              />
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Bairro *</label>
                <input
                  type="text"
                  className="form-control"
                  name="bairro"
                  value={formData.bairro}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Estado *</label>
                <select
                  className="form-control"
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Selecione</option>
                  <option value="SP">SP</option>
                  <option value="RJ">RJ</option>
                  <option value="MG">MG</option>
                  <option value="PR">PR</option>
                  <option value="RS">RS</option>
                  <option value="BA">BA</option>
                  <option value="PE">PE</option>
                  <option value="CE">CE</option>
                  <option value="DF">DF</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h5 className="text-danger">Saúde e Acesso</h5>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Peso (kg) *</label>
                <input
                  type="number"
                  className="form-control"
                  name="peso"
                  value={formData.peso}
                  onChange={handleInputChange}
                  min="50"
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Altura (cm) *</label>
                <input
                  type="number"
                  className="form-control"
                  name="altura"
                  value={formData.altura}
                  onChange={handleInputChange}
                  min="140"
                  max="220"
                  required
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Situação de Doação *</label>
                <select
                  className="form-control"
                  name="ultima_doacao_tipo"
                  value={formData.ultima_doacao_tipo}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Selecione</option>
                  <option value="nunca">Nunca doei</option>
                  <option value="doador">Já sou doador</option>
                </select>
              </div>

              {formData.ultima_doacao_tipo === "doador" && (
                <div className="col-md-6 mb-3">
                  <label className="form-label">Data da Última Doação *</label>
                  <input
                    type="date"
                    className="form-control"
                    name="ultima_doacao"
                    value={formData.ultima_doacao}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">Próxima Doação</label>
              <input
                type="date"
                className="form-control"
                name="proxima_doacao"
                value={formData.proxima_doacao}
                disabled
              />
              <small className="text-muted">
                Calculada automaticamente (+90 dias)
              </small>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Senha *</label>
                <input
                  type="password"
                  className="form-control"
                  name="senha"
                  value={formData.senha}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Confirmar Senha *</label>
                <input
                  type="password"
                  className="form-control"
                  name="confirmar_senha"
                  value={formData.confirmar_senha}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-check mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                name="termos"
                checked={formData.termos}
                onChange={handleInputChange}
                required
              />
              <label className="form-check-label">
                Declaro que todas as informações são verdadeiras e que atendo
                aos requisitos básicos para doação de sangue *
              </label>
            </div>
          </div>

          <button type="submit" className="btn btn-danger btn-block mt-3 w-100">
            Cadastrar como Doador
          </button>

          <div className="text-center mt-3">
            <small>
              Já possui conta? <Link to="/login/doador">Faça login</Link>
            </small>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CadastroDoador;
