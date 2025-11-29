import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavigationDoador from "../../../components/Navigation/NavigationDoador";
import Footer from "../../../components/Footer";
import { api } from "../../../services/api";
import "./styles.css";

const PerfilDoador = () => {
  const [dados, setDados] = useState(null);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        if (!api.isAuthenticated()) {
          navigate("/login/doador");
          return;
        }

        const response = await api.getPerfilDoador();
        console.log("📋 Perfil doador:", response);
        console.log(
          "🧠 Estrutura completa do perfil:",
          JSON.stringify(response.data, null, 2)
        );

        if (response.success && response.data) {
          const carteira = response.data.carteira;
          setDados(carteira);
          setForm(carteira);
          console.log("✅ Dados carregados da carteira:", carteira);
        } else {
          alert("Erro ao carregar perfil.");
        }
      } catch (err) {
        console.error("❌ Erro ao carregar perfil:", err);
        navigate("/login/doador");
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
      const response = await api.atualizarPerfilDoador(form);
      if (response.success) {
        alert("Perfil atualizado com sucesso!");
        setEditando(false);
      } else {
        alert(response.message);
      }
    } catch (err) {
      console.error("❌ Erro ao salvar:", err);
    }
  };

  if (loading) {
    return (
      <div>
        <NavigationDoador />
        <div className="text-center mt-5 py-5">
          <div className="spinner-border text-danger" role="status" />
          <p className="mt-3">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!dados) {
    return (
      <div>
        <NavigationDoador />
        <div className="alert alert-warning m-5">
          Não foi possível carregar os dados do perfil.
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavigationDoador />
      <div className="container py-5">
        <div className="card shadow border-0">
          <div className="card-header bg-danger text-white d-flex justify-content-between align-items-center">
            <h4 className="mb-0">
              <i className="fas fa-user me-2"></i>Meu Perfil de Doador
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
              <div className="col-md-6">
                <label className="form-label">Nome</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.nome}
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

              <div className="col-md-4">
                <label className="form-label">CPF</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.cpf}
                  disabled
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">RG</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.rg}
                  disabled
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Data de Nascimento</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.data_nascimento}
                  disabled
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Sexo</label>
                <select
                  className="form-select"
                  name="sexo"
                  value={form.sexo || ""}
                  onChange={handleChange}
                  disabled={!editando}
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label">Tipo Sanguíneo</label>
                <input
                  type="text"
                  className="form-control"
                  name="tipo_sanguineo"
                  value={form.tipo_sanguineo || ""}
                  onChange={handleChange}
                  disabled={!editando}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Peso (kg)</label>
                <input
                  type="number"
                  className="form-control"
                  name="peso"
                  value={form.peso || ""}
                  onChange={handleChange}
                  disabled={!editando}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Altura (cm)</label>
                <input
                  type="number"
                  className="form-control"
                  name="altura"
                  value={form.altura || ""}
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

              <div className="col-md-3">
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

              <div className="col-md-6">
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
                <label className="form-label">Bairro</label>
                <input
                  type="text"
                  className="form-control"
                  name="bairro"
                  value={form.bairro || ""}
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

              <div className="col-md-5">
                <label className="form-label">Última Doação</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.ultima_doacao || "Nenhuma"}
                  disabled
                />
              </div>

              <div className="col-md-5">
                <label className="form-label">Próxima Doação</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.proxima_doacao || "Indefinida"}
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

export default PerfilDoador;
