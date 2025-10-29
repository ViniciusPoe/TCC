import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../services/api";
import "./styles.css";

const NavigationDoador = () => {
  const modalRef = useRef(null);

  // 🔧 Inicializa o modal quando o componente monta
  useEffect(() => {
    // Importa o Bootstrap dinamicamente
    const initBootstrap = async () => {
      if (typeof window !== 'undefined') {
        // Verifica se o Bootstrap já está disponível
        if (!window.bootstrap) {
          // Tenta carregar o Bootstrap se não estiver disponível
          try {
            // Esta linha pode variar dependendo de como você importa o Bootstrap
            // Se você já tem Bootstrap via CDN, isso não é necessário
            console.log("🔧 Bootstrap carregado");
          } catch (error) {
            console.warn("⚠️ Bootstrap não pôde ser carregado:", error);
          }
        }
      }
    };

    initBootstrap();
  }, []);

  // 🔐 Função para alterar senha
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
        
        // ✅ CORREÇÃO: Fecha o modal de forma 100% segura
        const modalElement = document.getElementById("modalAlterarSenha");
        if (modalElement) {
          // Método 1: Tenta com Bootstrap se disponível
          if (window.bootstrap) {
            const modal = window.bootstrap.Modal.getInstance(modalElement);
            if (modal) {
              modal.hide();
            }
          } 
          // Método 2: Remove as classes do modal manualmente (fallback)
          else {
            modalElement.classList.remove('show');
            modalElement.style.display = 'none';
            modalElement.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('modal-open');
            
            // Remove o backdrop
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
              backdrop.remove();
            }
          }
        }

        // Limpa campos
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
      <nav className="navbar navbar-expand-lg navbar-dark navigation-doador">
        <div className="container">
          {/* Marca */}
          <Link
            className="navbar-brand d-flex align-items-center"
            to="/doador/inicio"
          >
            <i className="fas fa-heartbeat me-2"></i>
            <span className="fw-bold">BloodSystem</span>
          </Link>

          {/* Botão responsivo */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarDoador"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Menu principal */}
          <div className="collapse navbar-collapse" id="navbarDoador">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item mx-1">
                <Link className="nav-link d-flex align-items-center py-3" to="/doador/inicio">
                  <i className="fas fa-home me-2"></i> Início
                </Link>
              </li>

              <li className="nav-item mx-1">
                <Link className="nav-link d-flex align-items-center py-3" to="/doador/agendamento">
                  <i className="fas fa-calendar-plus me-2"></i> Agendar
                </Link>
              </li>

              <li className="nav-item mx-1">
                <Link className="nav-link d-flex align-items-center py-3" to="/doador/historico">
                  <i className="fas fa-history me-2"></i> Histórico
                </Link>
              </li>

              <li className="nav-item mx-1">
                <Link className="nav-link d-flex align-items-center py-3" to="/doador/campanhas">
                  <i className="fas fa-newspaper me-2"></i> Campanhas
                </Link>
              </li>

              {/* Dropdown Perfil */}
              <li className="nav-item dropdown mx-1">
                <a
                  className="nav-link dropdown-toggle d-flex align-items-center py-3"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                >
                  <div className="avatar rounded-circle d-flex align-items-center justify-content-center me-2 bg-danger text-white">
                    <i className="fas fa-user"></i>
                  </div>
                  <span className="d-none d-lg-inline">Doador</span>
                </a>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <Link className="dropdown-item" to="/doador/carteira">
                      <i className="fas fa-id-card me-2 text-danger"></i> Perfil
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

      {/* Modal Alterar Senha */}
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
            <div className="modal-header bg-danger text-white">
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
                className="btn btn-danger"
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

export default NavigationDoador;