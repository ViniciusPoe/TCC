import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import { authManager } from "../../../utils/authManager";
import "./styles.css";

const LoginDoador = () => {
  const [formData, setFormData] = useState({
    cpf: "",   // ✅ agora o backend recebe corretamente
    senha: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // =======================================================
  // 🧩 Atualiza campos do formulário
  // =======================================================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  // =======================================================
  // 🚀 Envio do formulário
  // =======================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.loginDoador(formData);

      if (response.success) {
        console.log("✅ Login bem-sucedido!", response);

        const apiData = response?.data;
        if (!apiData?.token) {
          console.error("⚠️ Token não encontrado na resposta:", response);
          setError("Erro no login: token não recebido.");
          return;
        }

        // 🔐 Salva sessão global
        authManager.setAuth(apiData.token, {
          id: apiData.id,
          nome: apiData.nome,
          cpf: apiData.cpf,
          tipo: "doador",
          email: apiData.email,
        });

        console.log("✅ Login salvo com sucesso:", apiData.nome);

        // Redireciona ao painel
        navigate("/doador/inicio");
      } else {
        setError(response.message || "CPF ou senha incorretos");
      }
    } catch (err) {
      console.error("❌ Erro no login:", err);
      setError("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  // =======================================================
  // 🎨 Interface
  // =======================================================
  return (
    <div className="container doador-login">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="doador-login-card shadow">
            <div className="text-center mb-4">
              <i className="fas fa-heartbeat text-danger fa-3x mb-3"></i>
              <h4 className="mt-3 doador-title">Acesso do Doador</h4>
              <p className="text-muted">
                Entre com suas credenciais para acessar a plataforma
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label htmlFor="cpf" className="form-label">
                  CPF *
                </label>
                <input
                  type="text"
                  name="cpf"
                  id="cpf"
                  placeholder="Digite seu CPF"
                  className="form-control"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="senha" className="form-label">
                  Senha *
                </label>
                <input
                  type="password"
                  name="senha"
                  id="senha"
                  placeholder="Digite sua senha"
                  className="form-control"
                  value={formData.senha}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="rememberMe"
                    disabled={loading}
                  />
                  <label className="form-check-label" htmlFor="rememberMe">
                    Lembrar de mim
                  </label>
                </div>
                <a href="#" className="text-danger">
                  Esqueceu a senha?
                </a>
              </div>

              <button
                type="submit"
                className="btn btn-danger w-100 py-2 mb-3"
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
                    ENTRANDO...
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
                  Não tem uma conta?{" "}
                  <Link to="/cadastro/doador" className="text-danger">
                    Cadastre-se
                  </Link>
                </p>
                <p className="mb-0">
                  <small>
                    É uma instituição?{" "}
                    <Link to="/login/hemocentro" className="text-danger">
                      Acesse aqui
                    </Link>
                  </small>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginDoador;
