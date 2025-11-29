import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavigationHemocentro from "../../../components/Navigation/NavigationHemocentro";
import Footer from "../../../components/Footer";
import { api } from "../../../services/api";
import "./styles.css";

const PerfilHemocentro = () => {
  const [dados, setDados] = useState(null);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        if (!api.isAuthenticated()) {
          navigate("/login/hemocentro");
          return;
        }

        const response = await api.getHemocentroInfo();
        console.log("🏥 Perfil hemocentro:", response);
        console.log(
          "📦 Estrutura completa do perfil:",
          JSON.stringify(response.data, null, 2)
        );

        if (response.success && response.data && response.data.perfil) {
          const perfil = response.data.perfil;
          setDados(perfil);
          setForm(perfil);
          console.log("✅ Dados carregados:", perfil);
        } else {
          alert("Erro ao carregar perfil do hemocentro.");
        }
      } catch (err) {
        console.error("❌ Erro ao carregar perfil do hemocentro:", err);
        navigate("/login/hemocentro");
      } finally {
        setLoading(false);
      }
    };

    fetchPerfil();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSalvar = async () => {
    try {
      const response = await api.atualizarPerfilHemocentro(form);
      if (response.success) {
        alert("Perfil atualizado com sucesso!");
        setEditando(false);
      } else {
        alert(response.message || "Erro ao atualizar perfil.");
      }
    } catch (err) {
      console.error("❌ Erro ao salvar perfil:", err);
      alert("Erro ao salvar alterações.");
    }
  };

  if (loading) {
    return (
      <div>
        <NavigationHemocentro />
        <div className="text-center mt-5 py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-3">Carregando informações...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!dados) {
    return (
      <div>
        <NavigationHemocentro />
        <div className="alert alert-warning m-5">
          Não foi possível carregar os dados do hemocentro.
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavigationHemocentro />
      <div className="container py-5">
        <div className="card shadow border-0">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h4 className="mb-0">
              <i className="fas fa-hospital me-2"></i>Perfil do Hemocentro
            </h4>
            <button
              className="btn btn-light btn-sm"
              onClick={() => setEditando(!editando)}
            >
              <i className={`fas fa-${editando ? "times" : "edit"} me-1`}></i>
              {editando ? "Cancelar" : "Editar"}
            </button>
          </div>

          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-8">
                <label className="form-label">Nome da Instituição</label>
                <input
                  type="text"
                  className="form-control"
                  name="nome_instituicao"
                  value={form.nome_instituicao || ""}
                  onChange={handleChange}
                  disabled={!editando}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">CNPJ</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.cnpj || ""}
                  disabled
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={form.email || ""}
                  onChange={handleChange}
                  disabled={!editando}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Telefone</label>
                <input
                  type="text"
                  className="form-control"
                  name="telefone"
                  value={form.telefone || ""}
                  onChange={handleChange}
                  disabled={!editando}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">CEP</label>
                <input
                  type="text"
                  className="form-control"
                  name="cep"
                  value={form.cep || ""}
                  onChange={handleChange}
                  disabled={!editando}
                />
              </div>

              <div className="col-md-5">
                <label className="form-label">Logradouro</label>
                <input
                  type="text"
                  className="form-control"
                  name="logradouro"
                  value={form.logradouro || ""}
                  onChange={handleChange}
                  disabled={!editando}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Número</label>
                <input
                  type="text"
                  className="form-control"
                  name="numero"
                  value={form.numero || ""}
                  onChange={handleChange}
                  disabled={!editando}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Complemento</label>
                <input
                  type="text"
                  className="form-control"
                  name="complemento"
                  value={form.complemento || ""}
                  onChange={handleChange}
                  disabled={!editando}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Cidade</label>
                <input
                  type="text"
                  className="form-control"
                  name="cidade"
                  value={form.cidade || ""}
                  onChange={handleChange}
                  disabled={!editando}
                />
              </div>

              <div className="col-md-2">
                <label className="form-label">Estado (UF)</label>
                <input
                  type="text"
                  className="form-control"
                  name="estado"
                  value={form.estado || ""}
                  onChange={handleChange}
                  disabled={!editando}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Horário de Início</label>
                <input
                  type="time"
                  className="form-control"
                  name="horario_inicio"
                  value={form.horario_inicio || ""}
                  onChange={handleChange}
                  disabled={!editando}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Horário de Término</label>
                <input
                  type="time"
                  className="form-control"
                  name="horario_fim"
                  value={form.horario_fim || ""}
                  onChange={handleChange}
                  disabled={!editando}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Total de Agendamentos</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.total_agendamentos || 0}
                  disabled
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Doações Realizadas</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.doacoes_realizadas || 0}
                  disabled
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Agendamentos de Hoje</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.agendamentos_hoje || 0}
                  disabled
                />
              </div>
            </div>
          </div>

          {editando && (
            <div className="card-footer bg-light text-end">
              <button className="btn btn-success" onClick={handleSalvar}>
                <i className="fas fa-save me-1"></i>Salvar Alterações
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PerfilHemocentro;
