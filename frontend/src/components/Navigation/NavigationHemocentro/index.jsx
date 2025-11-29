import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../services/api.js";
import "./styles.css";

const NavigationHemocentro = () => {
  const modalRef = useRef(null);

  useEffect(() => {
    const initBootstrap = async () => {
      if (typeof window !== 'undefined') {
        if (!window.bootstrap) {
          try {
            console.log("🔧 Bootstrap carregado");
          } catch (error) {
            console.warn("⚠️ Bootstrap não pôde ser carregado:", error);
          }
        }
      }
    };

    initBootstrap();
  }, []);

  const handleAlterarSenha = async () => {
    const senhaAtual = document.getElementById("senhaAtual").value;
    const novaSenha = document.getElementById("novaSenha").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      alert("⚠️ Preencha todos os campos.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      alert("❌ As senhas não coincidem!");
      return;
    }

    try {
      const response = await api.alterarSenha({
        senha_atual: senhaAtual,
        nova_senha: novaSenha,
      });

      if (response.success) {
        alert("✅ Senha alterada com sucesso!");

        const modalElement = document.getElementById("modalAlterarSenha");
        if (modalElement) {
          if (window.bootstrap) {
            const modal = window.bootstrap.Modal.getInstance(modalElement);
            if (modal) {
              modal.hide();
            }
          } 
          else {
            modalElement.classList.remove('show');
            modalElement.style.display = 'none';
            modalElement.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('modal-open');
            
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
              backdrop.remove();
            }
          }
        }

        document.getElementById("senhaAtual").value = "";
        document.getElementById("novaSenha").value = "";
        document.getElementById("confirmarSenha").value = "";
      } else {
        alert(`❌ Erro: ${response.message || "Não foi possível alterar a senha."}`);
      }
    } catch (error) {
      console.error("❌ Erro ao alterar senha:", error);
      alert(`❌ ${error.message || "Ocorreu um erro ao alterar a senha. Tente novamente."}`);
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navigation-hemocentro">
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center" to="/hemocentro/inicio">
            <i className="fas fa-hospital me-2"></i>
            <span className="fw-bold">Hemocentro</span>
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarHemocentro"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarHemocentro">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item mx-1">
                <Link className="nav-link d-flex align-items-center py-3" to="/hemocentro/inicio">
                  <i className="fas fa-home me-2"></i> Início
                </Link>
              </li>

              <li className="nav-item mx-1">
                <Link className="nav-link d-flex align-items-center py-3" to="/hemocentro/agendamentos">
                  <i className="fas fa-calendar-alt me-2"></i> Agendamentos
                </Link>
              </li>

              <li className="nav-item mx-1">
                <Link className="nav-link d-flex align-items-center py-3" to="/hemocentro/doadores">
                  <i className="fas fa-users me-2"></i> Doadores
                </Link>
              </li>

              <li className="nav-item mx-1">
                <Link className="nav-link d-flex align-items-center py-3" to="/hemocentro/registros">
                  <i className="fas fa-tint me-2"></i> Registros
                </Link>
              </li>

              <li className="nav-item mx-1">
                <Link className="nav-link d-flex align-items-center py-3" to="/hemocentro/campanhas">
                  <i className="fas fa-bullhorn me-2"></i> Campanhas
                </Link>
              </li>

              <li className="nav-item dropdown mx-1">
                <a
                  className="nav-link dropdown-toggle d-flex align-items-center py-3"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                >
                  <div className="avatar rounded-circle d-flex align-items-center justify-content-center me-2 bg-primary text-white">
                    <i className="fas fa-user-md"></i>
                  </div>
                  <span className="d-none d-lg-inline">Hemocentro</span>
                </a>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <Link className="dropdown-item" to="/hemocentro/perfil">
                      <i className="fas fa-id-card me-2 text-primary"></i> Perfil
                    </Link>
                  </li>
                  <li>
                    <button
                      className="dropdown-item"
                      data-bs-toggle="modal"
                      data-bs-target="#modalAlterarSenha"
                    >
                      <i className="fas fa-lock me-2 text-warning"></i> Alterar Senha
                    </button>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <button 
                      className="dropdown-item text-danger"
                      onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('userType');
                        window.location.href = '/';
                      }}
                    >
                      <i className="fas fa-sign-out-alt me-2"></i> Sair
                    </button>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div
        className="modal fade"
        id="modalAlterarSenha"
        tabIndex="-1"
        aria-labelledby="modalAlterarSenhaLabel"
        aria-hidden="true"
        ref={modalRef}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-warning text-dark">
              <h5 className="modal-title" id="modalAlterarSenhaLabel">
                <i className="fas fa-lock me-2"></i>Alterar Senha
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                data-bs-dismiss="modal" 
                aria-label="Fechar"
              ></button>
            </div>
            <div className="modal-body">
              <form id="formAlterarSenha" onSubmit={(e) => {
                e.preventDefault();
                handleAlterarSenha();
              }}>
                <div className="mb-3">
                  <label className="form-label">Senha Atual</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Digite sua senha atual"
                    id="senhaAtual"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Nova Senha</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Digite a nova senha"
                    id="novaSenha"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Confirme a nova senha"
                    id="confirmarSenha"
                    required
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                data-bs-dismiss="modal"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-warning" 
                onClick={handleAlterarSenha}
              >
                <i className="fas fa-save me-1"></i> Salvar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NavigationHemocentro;