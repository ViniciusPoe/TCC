import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavigationInstituicao from "../../../components/Navigation/NavigationHemocentro";
import Footer from "../../../components/Footer";
import { api } from "../../../services/api";
import "./styles.css";

const CampanhasHemocentro = () => {
  const [campanhas, setCampanhas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [campanhaEditando, setCampanhaEditando] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState("todas");
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    dataInicio: "",
    dataFim: "",
    status: "ativa",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ✅ Verificar autenticação primeiro
        if (!api.isAuthenticated()) {
          console.log("❌ Hemocentro não autenticado, redirecionando...");
          navigate("/login/hemocentro");
          return;
        }

        // ✅ Buscar dados do hemocentro atual da memória
        const currentUser = api.getCurrentUser();
        console.log("🏥 DEBUG - Hemocentro atual:", currentUser);

        if (!currentUser || currentUser.tipo !== "hemocentro") {
          console.log("❌ Tipo de usuário inválido, redirecionando...");
          navigate("/login/hemocentro");
          return;
        }

        console.log("🔄 Buscando campanhas da API...");

        // ✅ Buscar campanhas SEM passar ID - a API usa o usuário logado
        const response = await api.getCampanhas();
        console.log("📊 Resposta COMPLETA da API:", response);

        if (response.success && response.data?.campanhas) {
          console.log("✅ Campanhas recebidas:", response.data.campanhas);
          setCampanhas(response.data.campanhas);
        } else {
          console.error("❌ API não retornou dados válidos:", response);
          setCampanhas([]);
        }

        setLoading(false);
      } catch (error) {
        console.error("💥 Erro ao carregar campanhas:", error);

        // ✅ Se erro de autenticação, redirecionar
        if (
          error.message.includes("token") ||
          error.message.includes("autenticação")
        ) {
          navigate("/login/hemocentro");
          return;
        }

        setCampanhas([]);
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // ✅ Verificar autenticação
      if (!api.isAuthenticated()) {
        alert("Sessão expirada. Faça login novamente.");
        navigate("/login/hemocentro");
        return;
      }

      const currentUser = api.getCurrentUser();
      const campanhaData = {
        ...formData,
        local: currentUser
          ? `${currentUser.nome} - ${currentUser.cidade || ""}/${
              currentUser.estado || ""
            }`
          : "Hemocentro",
      };

      if (campanhaEditando) {
        // ✅ Editar campanha existente
        const response = await api.editarCampanha(
          campanhaEditando.id,
          campanhaData
        );
        if (response.success) {
          setCampanhas(
            campanhas.map((camp) =>
              camp.id === campanhaEditando.id
                ? { ...campanhaData, id: campanhaEditando.id }
                : camp
            )
          );
          alert("Campanha atualizada com sucesso!");
        } else {
          alert("Erro ao atualizar campanha: " + response.message);
        }
      } else {
        // ✅ Criar nova campanha
        const response = await api.criarCampanha(campanhaData);

        if (response.success && response.data?.campanha) {
          console.log("✅ Campanha criada:", response.data.campanha);
          setCampanhas([response.data.campanha, ...campanhas]);
          alert("Campanha criada com sucesso!");
        } else {
          console.error("❌ Falha ao criar:", response);
          alert(
            "Erro ao criar campanha: " +
              (response.message || "Erro desconhecido")
          );
        }
      }

      // Limpar formulário
      setFormData({
        titulo: "",
        descricao: "",
        dataInicio: "",
        dataFim: "",
        status: "ativa",
      });
      setShowForm(false);
      setCampanhaEditando(null);
    } catch (error) {
      console.error("Erro ao salvar campanha:", error);
      alert("Erro ao conectar com o servidor");
    }
  };

  const handleEditar = (campanha) => {
    setFormData({
      titulo: campanha.titulo,
      descricao: campanha.descricao,
      dataInicio: campanha.dataInicio,
      dataFim: campanha.dataFim,
      status: campanha.status,
    });
    setCampanhaEditando(campanha);
    setShowForm(true);
  };

  const handleExcluir = async (campanhaId) => {
    if (window.confirm("Tem certeza que deseja excluir esta campanha?")) {
      try {
        // ✅ Verificar autenticação
        if (!api.isAuthenticated()) {
          alert("Sessão expirada. Faça login novamente.");
          navigate("/login/hemocentro");
          return;
        }

        const response = await api.excluirCampanha(campanhaId);
        if (response.success) {
          setCampanhas(campanhas.filter((camp) => camp.id !== campanhaId));
          alert("Campanha excluída com sucesso!");
        } else {
          alert("Erro ao excluir campanha: " + response.message);
        }
      } catch (error) {
        console.error("Erro ao excluir campanha:", error);
        alert("Erro ao conectar com o servidor");
      }
    }
  };

  const handleConcluir = async (campanhaId) => {
    if (!window.confirm("Deseja marcar esta campanha como concluída?")) return;

    try {
      const response = await api.concluirCampanha(campanhaId);
      if (response.success) {
        setCampanhas((prev) =>
          prev.map((c) =>
            c.id === campanhaId ? { ...c, status: "concluida" } : c
          )
        );
        alert("Campanha concluída com sucesso!");
      } else {
        alert("Erro: " + response.message);
      }
    } catch (error) {
      console.error("Erro ao concluir campanha:", error);
      alert("Erro ao conectar com o servidor.");
    }
  };

  const handleCancelar = () => {
    setFormData({
      titulo: "",
      descricao: "",
      dataInicio: "",
      dataFim: "",
      status: "ativa",
    });
    setShowForm(false);
    setCampanhaEditando(null);
  };

  const campanhasFiltradas = campanhas.filter((campanha) => {
    if (filtroStatus === "todas") return true;
    return campanha.status === filtroStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "ativa":
        return "badge bg-success";
      case "concluida":
        return "badge bg-secondary";
      default:
        return "badge bg-primary";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "ativa":
        return "Ativa";
      case "concluida":
        return "Concluída";
      default:
        return status;
    }
  };

  const formatarData = (data) => {
    if (!data) return "—";
    const date = new Date(data);
    if (isNaN(date)) return "—";
    return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  };
  if (loading) {
    return (
      <div>
        <NavigationInstituicao />
        <div className="text-center mt-5 py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="mt-3">Carregando campanhas...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="campanhas-hemocentro">
      <NavigationInstituicao />

      <div className="container-fluid px-4 py-5">
        <div className="container">
          {/* Header da Página */}
          <div className="row mb-5">
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h1 className="display-5 fw-bold text-primary mb-2">
                    <i className="fas fa-bullhorn me-3"></i>Gestão de Campanhas
                  </h1>
                  <p className="lead text-muted">
                    Crie e gerencie campanhas para captação de doadores
                  </p>
                </div>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => setShowForm(true)}
                >
                  <i className="fas fa-plus me-2"></i>Nova Campanha
                </button>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-md-6">
                      <h6 className="mb-0">Filtrar por status:</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="btn-group w-100" role="group">
                        <button
                          type="button"
                          className={`btn ${
                            filtroStatus === "todas"
                              ? "btn-primary"
                              : "btn-outline-primary"
                          }`}
                          onClick={() => setFiltroStatus("todas")}
                        >
                          Todas
                        </button>
                        <button
                          type="button"
                          className={`btn ${
                            filtroStatus === "ativa"
                              ? "btn-success"
                              : "btn-outline-success"
                          }`}
                          onClick={() => setFiltroStatus("ativa")}
                        >
                          Ativas
                        </button>
                        <button
                          type="button"
                          className={`btn ${
                            filtroStatus === "concluida"
                              ? "btn-secondary"
                              : "btn-outline-secondary"
                          }`}
                          onClick={() => setFiltroStatus("concluida")}
                        >
                          Concluídas
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulário de Campanha */}
          {showForm && (
            <div className="row mb-5">
              <div className="col-12">
                <div className="card border-0 shadow-lg">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">
                      <i className="fas fa-plus-circle me-2"></i>
                      {campanhaEditando ? "Editar Campanha" : "Nova Campanha"}
                    </h5>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleSubmit}>
                      <div className="row">
                        <div className="col-md-8 mb-3">
                          <label className="form-label">
                            Título da Campanha *
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="titulo"
                            value={formData.titulo}
                            onChange={handleInputChange}
                            required
                            placeholder="Ex: Doe Sangue, Salve Vidas!"
                          />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Status</label>
                          <select
                            className="form-select"
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                          >
                            <option value="ativa">Ativa</option>
                            <option value="concluida">Concluída</option>
                          </select>
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Descrição *</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          name="descricao"
                          value={formData.descricao}
                          onChange={handleInputChange}
                          required
                          placeholder="Descreva os objetivos e importância desta campanha..."
                        />
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Local</label>
                          <input
                            type="text"
                            className="form-control"
                            value={
                              api.getCurrentUser()
                                ? `${api.getCurrentUser().nome} - ${
                                    api.getCurrentUser().cidade || ""
                                  }/${api.getCurrentUser().estado || ""}`
                                : "Carregando..."
                            }
                            readOnly
                            style={{ backgroundColor: "#f8f9fa" }}
                          />
                          <small className="text-muted">
                            Local preenchido automaticamente com os dados do
                            hemocentro
                          </small>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Data de Início *</label>
                          <input
                            type="date"
                            className="form-control"
                            name="dataInicio"
                            value={formData.dataInicio}
                            onChange={handleInputChange}
                            required
                            min={new Date().toISOString().split("T")[0]} // 🔒 impede dias anteriores
                          />
                        </div>

                        <div className="col-md-6 mb-3">
                          <label className="form-label">
                            Data de Término *
                          </label>
                          <input
                            type="date"
                            className="form-control"
                            name="dataFim"
                            value={formData.dataFim}
                            onChange={handleInputChange}
                            required
                            min={new Date().toISOString().split("T")[0]} // 🔒 idem aqui
                          />
                        </div>
                      </div>

                      <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-primary">
                          <i className="fas fa-save me-1"></i>
                          {campanhaEditando
                            ? "Atualizar Campanha"
                            : "Criar Campanha"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={handleCancelar}
                        >
                          <i className="fas fa-times me-1"></i>Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lista de Campanhas */}
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white">
                  <h5 className="mb-0">
                    <i className="fas fa-list me-2"></i>
                    Campanhas ({campanhasFiltradas.length})
                  </h5>
                </div>
                <div className="card-body p-0">
                  {campanhasFiltradas.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="fas fa-bullhorn fa-4x text-muted mb-3"></i>
                      <h5 className="text-muted">
                        Nenhuma campanha encontrada
                      </h5>
                      <p className="text-muted mb-4">
                        {filtroStatus === "todas"
                          ? "Comece criando sua primeira campanha!"
                          : `Nenhuma campanha com status "${filtroStatus}"`}
                      </p>
                      {filtroStatus === "todas" && (
                        <button
                          className="btn btn-primary"
                          onClick={() => setShowForm(true)}
                        >
                          <i className="fas fa-plus me-1"></i>Criar Primeira
                          Campanha
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Título</th>
                            <th>Descrição</th>
                            <th>Local</th>
                            <th>Status</th>
                            <th>Período</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {campanhasFiltradas.map((campanha) => (
                            <tr key={campanha.id}>
                              <td>
                                <strong>{campanha.titulo}</strong>
                              </td>
                              <td>
                                <small className="text-muted">
                                  {campanha.descricao}
                                </small>
                              </td>
                              <td>
                                <small>{campanha.local}</small>
                              </td>
                              <td>
                                <span
                                  className={getStatusBadge(campanha.status)}
                                >
                                  {getStatusText(campanha.status)}
                                </span>
                              </td>
                              <td>
                                <small>
                                  {formatarData(campanha.data_inicio)} a{" "}
                                  {formatarData(campanha.data_fim)}
                                </small>
                              </td>
                              <td>
                                <div className="btn-group">
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => handleEditar(campanha)}
                                    title="Editar"
                                  >
                                    <i className="fas fa-edit"></i>
                                  </button>

                                  {campanha.status === "ativa" && (
                                    <button
                                      className="btn btn-sm btn-outline-success"
                                      onClick={() =>
                                        handleConcluir(campanha.id)
                                      }
                                      title="Concluir Campanha"
                                    >
                                      <i className="fas fa-check"></i>
                                    </button>
                                  )}

                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleExcluir(campanha.id)}
                                    title="Excluir"
                                  >
                                    <i className="fas fa-trash"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="row mt-5">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white">
                  <h5 className="mb-0">
                    <i className="fas fa-chart-bar me-2"></i>
                    Estatísticas das Campanhas
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row text-center">
                    <div className="col-md-4">
                      <div className="stat-item">
                        <h3 className="text-primary">{campanhas.length}</h3>
                        <p className="text-muted mb-0">Total de Campanhas</p>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="stat-item">
                        <h3 className="text-success">
                          {campanhas.filter((c) => c.status === "ativa").length}
                        </h3>
                        <p className="text-muted mb-0">Campanhas Ativas</p>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="stat-item">
                        <h3 className="text-secondary">
                          {
                            campanhas.filter((c) => c.status === "concluida")
                              .length
                          }
                        </h3>
                        <p className="text-muted mb-0">Campanhas Concluidas</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CampanhasHemocentro;
