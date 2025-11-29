import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./styles.css";
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const CadastroHemocentro = () => {
  const [formData, setFormData] = useState({
    nome_instituicao: "",
    cnpj: "",
    logradouro: "",
    numero: "",
    complemento: "",
    cidade: "",
    estado: "",
    cep: "",
    horario_inicio: "",
    horario_fim: "",
    email: "",
    telefone: "",
    senha: "",
    confirmar_senha: "",
    termos: false,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const buscarCEP = async (cep) => {
    if (cep.length === 9) {
      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${cep.replace("-", "")}/json/`
        );
        const data = await response.json();
        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            logradouro: data.logradouro || "",
            cidade: data.localidade || "",
            estado: data.uf || "",
            complemento: data.complemento || "",
          }));
        }
      } catch (error) {
        console.log("Erro ao buscar CEP:", error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (formData.senha !== formData.confirmar_senha) {
      setError("As senhas não coincidem");
      setLoading(false);
      return;
    }

    if (!formData.termos) {
      setError("Você deve aceitar os termos e condições");
      setLoading(false);
      return;
    }

    if (!formData.horario_inicio || !formData.horario_fim) {
      setError("Defina o horário de funcionamento completo.");
      setLoading(false);
      return;
    }

    try {
      const dadosParaEnviar = {
        nome_instituicao: formData.nome_instituicao,
        cnpj: formData.cnpj,
        logradouro: formData.logradouro,
        numero: formData.numero,
        complemento: formData.complemento,
        cidade: formData.cidade,
        estado: formData.estado,
        cep: formData.cep,
        horario_inicio: formData.horario_inicio,
        horario_fim: formData.horario_fim,
        email: formData.email,
        telefone: formData.telefone,
        senha: formData.senha,
      };

      const response = await fetch(`${API_BASE_URL}/api/cadastro/hemocentro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosParaEnviar),
      });

      const data = await response.json();

      if (data.success) {
        alert("Cadastro realizado com sucesso!");
        window.location.href = "/login/hemocentro";
      } else {
        setError(data.message || "Erro no cadastro");
      }
    } catch (err) {
      console.error("❌ Erro ao cadastrar:", err);
      setError(
        "Erro ao conectar com o servidor. Verifique se o backend está rodando."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hemocentro-register-container">
      <div className="hemocentro-register-card">
        <div className="hemocentro-register-header text-center mb-4">
          <i className="fas fa-hospital-alt text-primary fa-3x mb-3"></i>
          <h2 className="hemocentro-register-title">Cadastro de Hemocentro</h2>
          <p className="hemocentro-register-subtitle">
            Preencha todos os campos para registrar seu hemocentro
          </p>
        </div>

        {error && <div className="alert alert-primary">{error}</div>}

        <form onSubmit={handleSubmit}>

          <div className="mb-4">
            <h5 className="text-primary">Dados do Hemocentro</h5>
            <div className="row">
              <div className="col-md-8 mb-3">
                <label>Nome da Instituição *</label>
                <input
                  type="text"
                  name="nome_instituicao"
                  className="form-control"
                  value={formData.nome_instituicao}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-4 mb-3">
                <label>CNPJ *</label>
                <input
                  type="text"
                  name="cnpj"
                  className="form-control"
                  value={formData.cnpj}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h5 className="text-primary">Endereço</h5>
            <div className="row">
              <div className="col-md-4 mb-3">
                <label>CEP *</label>
                <input
                  type="text"
                  name="cep"
                  className="form-control"
                  value={formData.cep}
                  onChange={(e) => {
                    handleInputChange(e);
                    buscarCEP(e.target.value);
                  }}
                  required
                />
              </div>
              <div className="col-md-4 mb-3">
                <label>Cidade *</label>
                <input
                  type="text"
                  name="cidade"
                  className="form-control"
                  value={formData.cidade}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-4 mb-3">
                <label>Estado *</label>
                <select
                  name="estado"
                  className="form-control"
                  value={formData.estado}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Selecione</option>
                  {["SP", "RJ", "MG", "PR", "RS", "BA", "PE", "CE", "DF"].map(
                    (uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label>Logradouro (Rua / Avenida) *</label>
                <input
                  type="text"
                  name="logradouro"
                  className="form-control"
                  value={formData.logradouro}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-3 mb-3">
                <label>Número *</label>
                <input
                  type="text"
                  name="numero"
                  className="form-control"
                  value={formData.numero}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-3 mb-3">
                <label>Complemento</label>
                <input
                  type="text"
                  name="complemento"
                  className="form-control"
                  value={formData.complemento}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h5 className="text-primary">Horário de Funcionamento</h5>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label>Início *</label>
                <input
                  type="time"
                  name="horario_inicio"
                  className="form-control"
                  value={formData.horario_inicio}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label>Término *</label>
                <input
                  type="time"
                  name="horario_fim"
                  className="form-control"
                  value={formData.horario_fim}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h5 className="text-primary">Contato</h5>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label>E-mail *</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label>Telefone *</label>
                <input
                  type="tel"
                  name="telefone"
                  className="form-control"
                  value={formData.telefone}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h5 className="text-primary">Acesso</h5>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label>Senha *</label>
                <input
                  type="password"
                  name="senha"
                  className="form-control"
                  value={formData.senha}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label>Confirmar Senha *</label>
                <input
                  type="password"
                  name="confirmar_senha"
                  className="form-control"
                  value={formData.confirmar_senha}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-check mb-4">
            <input
              className="form-check-input"
              type="checkbox"
              name="termos"
              checked={formData.termos}
              onChange={handleInputChange}
              required
            />
            <label className="form-check-label">
              Declaro que todas as informações são verdadeiras e que o
              hemocentro está regularizado para coleta de sangue.
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? "Cadastrando..." : "Cadastrar Hemocentro"}
          </button>

          <div className="text-center mt-4">
            <p>
              Já possui cadastro?{" "}
              <Link to="/login/hemocentro">Acesse sua conta</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CadastroHemocentro;
