import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import "./styles.css";

const LoginHemocentro = () => {
  const [formData, setFormData] = useState({
    cnpj: "",
    senha: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.loginHemocentro(formData);

      if (response.success) {
        console.log("✅ Login do hemocentro bem-sucedido!");
        navigate("/hemocentro/inicio");
      } else {
        setError(response.message || "Credenciais inválidas");
      }
    } catch (err) {
      console.error("❌ Erro no login do hemocentro:", err);
      setError("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  return (
    <div className="hemocentro-login-container">
      <div className="hemocentro-login-card shadow">
        <div className="hemocentro-header text-center mb-4">
          <i className="fas fa-hospital-alt text-primary fa-3x mb-3"></i>
          <h4 className="hemocentro-title">Acesso do Hemocentro</h4>
          <p className="hemocentro-subtitle">
            Sistema de Gerenciamento de Doações
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group mb-3">
            <label htmlFor="cnpj" className="form-label">
              CNPJ *
            </label>
            <input
              type="text"
              id="cnpj"
              name="cnpj"
              placeholder="Digite o CNPJ"
              className="form-control"
              value={formData.cnpj || ""}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group mb-4">
            <label htmlFor="senha" className="form-label">
              Senha *
            </label>
            <input
              type="password"
              className="form-control"
              id="senha"
              name="senha"
              value={formData.senha || ""}
              onChange={handleInputChange}
              required
              disabled={loading}
              placeholder="Digite sua senha"
            />
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="rememberHemocentro"
                disabled={loading}
              />
              <label className="form-check-label" htmlFor="rememberHemocentro">
                Manter conectado
              </label>
            </div>
            <a href="#" className="text-primary">
              Esqueceu a senha?
            </a>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2 mb-3"
            disabled={loading}
          >
            {loading ? (
              <>
                <div
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                >
                  <span className="visually-hidden">Carregando...</span>
                </div>
                ACESSANDO...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt me-2"></i> ENTRAR
              </>
            )}
          </button>

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          <div className="text-center mt-4">
            <p className="mb-2">
              Não possui cadastro?{" "}
              <Link to="/cadastro/hemocentro" className="text-primary">
                Solicite acesso
              </Link>
            </p>
            <p className="mb-0">
              <small>
                É um doador?{" "}
                <Link to="/login/doador" className="text-primary">
                  Acesse aqui
                </Link>
              </small>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginHemocentro;
