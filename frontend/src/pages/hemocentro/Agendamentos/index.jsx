import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavigationInstituicao from "../../../components/Navigation/NavigationHemocentro";
import Footer from "../../../components/Footer";
import { api } from "../../../services/api";
import "./styles.css";

const AgendamentosHemocentro = () => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [agendamentosFiltrados, setAgendamentosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModalReagendar, setShowModalReagendar] = useState(false);
  const [showModalDetalhes, setShowModalDetalhes] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);
  const [novaData, setNovaData] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ✅ NOVO: Verificar autenticação primeiro
        if (!api.isAuthenticated()) {
          console.log("❌ Hemocentro não autenticado, redirecionando...");
          navigate("/login/hemocentro");
          return;
        }

        // ✅ NOVO: Buscar dados do hemocentro atual da memória
        const currentUser = api.getCurrentUser();
        console.log("🏥 DEBUG - Hemocentro atual:", currentUser);

        if (!currentUser || currentUser.tipo !== "hemocentro") {
          console.log("❌ Tipo de usuário inválido, redirecionando...");
          navigate("/login/hemocentro");
          return;
        }

        console.log("🏥 Buscando agendamentos para hemocentro...");

        // ✅ NOVO: Buscar agendamentos SEM passar ID
        const response = await api.getAgendamentosHemocentro(); // ✅ SEM ID
        console.log("📋 Resposta da API Agendamentos:", response);

        if (response.success) {
          const lista =
            response.agendamentos ||
            response.data?.agendamentos ||
            response.data ||
            [];

          const agendamentosAtivos = lista.filter(
            (ag) => ag.status !== "cancelado"
          );

          console.log("✅ Agendamentos ativos:", agendamentosAtivos);

          setAgendamentos(agendamentosAtivos);
          console.log("🔍 Agendamentos recebidos:", response.agendamentos);
          setAgendamentosFiltrados(agendamentosAtivos);
        } else {
          console.error("Erro ao carregar agendamentos:", response.message);
          setAgendamentos([]);
          setAgendamentosFiltrados([]);
        }
      } catch (error) {
        console.error("Erro ao carregar agendamentos:", error);

        // ✅ NOVO: Se erro de autenticação, redirecionar
        if (
          error.message.includes("token") ||
          error.message.includes("autenticação")
        ) {
          navigate("/login/hemocentro");
          return;
        }

        setAgendamentos([]);
        setAgendamentosFiltrados([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // Aplicar filtro quando o filtroStatus ou agendamentos mudarem
  useEffect(() => {
    if (filtroStatus === "todos") {
      setAgendamentosFiltrados(agendamentos);
    } else {
      const filtrados = agendamentos.filter((ag) => ag.status === filtroStatus);
      setAgendamentosFiltrados(filtrados);
    }
  }, [filtroStatus, agendamentos]);

  const handleReagendar = (agendamento) => {
    setAgendamentoSelecionado(agendamento);
    // Converter data do formato DD/MM/YYYY para YYYY-MM-DD
    const [dia, mes, ano] = agendamento.data.split("/");
    setNovaData(`${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`);
    setShowModalReagendar(true);
  };

  const handleVerDetalhes = (agendamento) => {
    setAgendamentoSelecionado(agendamento);
    setShowModalDetalhes(true);
  };

  const handleConfirmarReagendamento = async () => {
    try {
      if (!agendamentoSelecionado) return;

      // ✅ NOVO: Verificar autenticação
      if (!api.isAuthenticated()) {
        alert("Sessão expirada. Faça login novamente.");
        navigate("/login/hemocentro");
        return;
      }

      const response = await api.reagendarAgendamento(
        agendamentoSelecionado.id,
        {
          data: novaData,
        }
      );

      if (response.success) {
        // Atualizar a lista de agendamentos
        const updatedAgendamentos = agendamentos.map((ag) =>
          ag.id === agendamentoSelecionado.id
            ? {
                ...ag,
                data: `${novaData.split("-")[2]}/${novaData.split("-")[1]}/${
                  novaData.split("-")[0]
                }`,
              }
            : ag
        );
        setAgendamentos(updatedAgendamentos);

        setShowModalReagendar(false);
        setAgendamentoSelecionado(null);
        setNovaData("");
        alert("Agendamento reagendado com sucesso!");
      } else {
        alert("Erro ao reagendar: " + response.message);
      }
    } catch (error) {
      console.error("Erro ao reagendar agendamento:", error);
      alert("Erro ao reagendar agendamento");
    }
  };

  // ✅ NOVO: Função para logout
  const handleLogout = async () => {
    try {
      await api.logout();
      navigate("/login/hemocentro");
    } catch (error) {
      console.error("Erro no logout:", error);
      navigate("/login/hemocentro");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "agendado":
        return "badge bg-warning";
      case "confirmado":
        return "badge bg-success";
      case "realizado":
        return "badge bg-info";
      default:
        return "badge bg-secondary";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pendente":
        return "Pendente";
      case "confirmado":
        return "Confirmado";
      case "realizado":
        return "Realizado";
      default:
        return status;
    }
  };

  const getTipoDoacaoText = (tipoDoacao) => {
    switch (tipoDoacao) {
      case "sangue_total":
        return "Sangue Total";
      case "plaquetas":
        return "Plaquetas";
      case "plasma":
        return "Plasma";
      default:
        return tipoDoacao;
    }
  };

  // Ordenar agendamentos por data (mais próximos primeiro)
  const agendamentosOrdenados = [...agendamentosFiltrados].sort((a, b) => {
    try {
      const [diaA, mesA, anoA] = a.data.split("/");
      const [diaB, mesB, anoB] = b.data.split("/");
      const dataA = new Date(anoA, mesA - 1, diaA);
      const dataB = new Date(anoB, mesB - 1, diaB);
      return dataA - dataB;
    } catch (error) {
      return 0;
    }
  });

  // Estatísticas para os filtros
  const estatisticas = {
    todos: agendamentos.length,
    agendado: agendamentos.filter((a) => a.status === "pendente").length,
    confirmado: agendamentos.filter((a) => a.status === "confirmado").length,
    realizado: agendamentos.filter((a) => a.status === "realizado").length,
  };

  if (loading) {
    return (
      <div>
        <NavigationInstituicao />
        <div className="text-center mt-5 py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="mt-3">Carregando agendamentos...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="agendamentos-hemocentro">
      <NavigationInstituicao />

      <div className="container-fluid px-4 py-5">
        <div className="container">
          {/* Header da Página */}
          <div className="row mb-5">
            <div className="col-12">
              <div className="text-center">
                <h1 className="display-5 fw-bold text-primary mb-2">
                  <i className="fas fa-calendar-alt me-3"></i>Agendamentos
                </h1>
                <p className="lead text-muted">
                  Visualize e gerencie os agendamentos de doação do seu
                  hemocentro
                </p>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="row mb-4">
            {[
              {
                titulo: "Total de Agendamentos",
                valor: agendamentos.length,
                cor: "primary",
                icone: "fa-calendar",
              },
              {
                titulo: "Agendados",
                valor: estatisticas.agendado,
                cor: "warning",
                icone: "fa-clock",
              },
              {
                titulo: "Realizados",
                valor: estatisticas.realizado,
                cor: "info",
                icone: "fa-check-double",
              },
            ].map((card, idx) => (
              <div key={idx} className="col-md-4 mb-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body text-center">
                    <i
                      className={`fas ${card.icone} fa-2x text-${card.cor} mb-3`}
                    ></i>
                    <h3 className={`text-${card.cor}`}>{card.valor}</h3>
                    <p className="text-muted mb-0">{card.titulo}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h6 className="mb-3">
                    <i className="fas fa-filter me-2 text-primary"></i>
                    Filtrar por Status
                  </h6>
                  <div className="btn-group w-100" role="group">
                    {[
                      {
                        key: "todos",
                        label: "Todos",
                        count: estatisticas.todos,
                      },
                      {
                        key: "pendente",
                        label: "Agendados",
                        count: estatisticas.pedente,
                      },
                      {
                        key: "realizado",
                        label: "Realizados",
                        count: estatisticas.realizado,
                      },
                    ].map((filtro) => (
                      <button
                        key={filtro.key}
                        type="button"
                        className={`btn ${
                          filtroStatus === filtro.key
                            ? "btn-primary"
                            : "btn-outline-primary"
                        } position-relative`}
                        onClick={() => setFiltroStatus(filtro.key)}
                      >
                        {filtro.label}
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-secondary">
                          {filtro.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Agendamentos */}
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="fas fa-list me-2"></i>
                    Lista de Agendamentos ({agendamentosOrdenados.length})
                  </h5>
                  <small className="text-muted">
                    Filtro:{" "}
                    {filtroStatus === "todos"
                      ? "Todos"
                      : filtroStatus === "pendente"
                      ? "Pendentes"
                      : "Realizados"}
                  </small>
                </div>
                <div className="card-body p-0">
                  {agendamentosOrdenados.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="fas fa-calendar-times fa-4x text-muted mb-3"></i>
                      <h5 className="text-muted">
                        Nenhum agendamento encontrado
                      </h5>
                      <p className="text-muted">
                        {filtroStatus === "todos"
                          ? "Não há agendamentos ativos no momento"
                          : `Não há agendamentos com status "${filtroStatus}" no momento`}
                      </p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Data</th>
                            <th>Doador</th>
                            <th>Tipo Sanguíneo</th>
                            <th>Contato</th>
                            <th>Tipo Doação</th>
                            <th>Status</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {agendamentosOrdenados.map((agendamento) => (
                            <tr key={agendamento.id}>
                              <td>
                                <div className="text-center">
                                  <strong>{agendamento.data}</strong>
                                </div>
                              </td>
                              <td>
                                <div>
                                  <strong>
                                    {agendamento.doador_nome || "Doador"}
                                  </strong>
                                  <br />
                                  <small className="text-muted">
                                    {agendamento.doador_email ||
                                      "Email não informado"}
                                  </small>
                                </div>
                              </td>
                              <td>
                                <span className="badge bg-primary rounded-pill px-3 py-2">
                                  {agendamento.doador_tipo_sanguineo ||
                                    "Não informado"}
                                </span>
                              </td>
                              <td>
                                <small>
                                  {agendamento.doador_telefone ||
                                    "Telefone não informado"}
                                </small>
                              </td>
                              <td>
                                <small className="text-muted">
                                  {getTipoDoacaoText(agendamento.tipo_doacao)}
                                </small>
                              </td>
                              <td>
                                <span
                                  className={getStatusBadge(agendamento.status)}
                                >
                                  {getStatusText(agendamento.status)}
                                </span>
                              </td>
                              <td>
                                <div className="btn-group">
                                  <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => handleReagendar(agendamento)}
                                    title="Reagendar"
                                    disabled={
                                      agendamento.status === "realizado"
                                    }
                                  >
                                    <i className="fas fa-calendar-alt"></i>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-info"
                                    title="Detalhes"
                                    onClick={() =>
                                      handleVerDetalhes(agendamento)
                                    }
                                  >
                                    <i className="fas fa-eye"></i>
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
        </div>
      </div>

      {/* Modal de Reagendamento */}
      {showModalReagendar && agendamentoSelecionado && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="fas fa-calendar-alt me-2"></i>
                  Reagendar Agendamento
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowModalReagendar(false);
                    setNovaData("");
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Doador</label>
                  <input
                    type="text"
                    className="form-control"
                    value={agendamentoSelecionado.doador_nome || "Doador"}
                    readOnly
                  />
                </div>
                <div className="row">
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Nova Data *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={novaData}
                      onChange={(e) => setNovaData(e.target.value)}
                      required
                      min={new Date().toISOString().split("T")[0]}
                    />
                    <small className="text-muted">
                      O horário será definido automaticamente pelo hemocentro
                    </small>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Agendamento Original</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={agendamentoSelecionado.data}
                    readOnly
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModalReagendar(false);
                    setNovaData("");
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirmarReagendamento}
                  disabled={!novaData}
                >
                  <i className="fas fa-calendar-check me-1"></i>
                  Confirmar Reagendamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes */}
      {showModalDetalhes && agendamentoSelecionado && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title">
                  <i className="fas fa-info-circle me-2"></i>
                  Detalhes do Agendamento
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModalDetalhes(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="detail-section mb-4">
                      <h6 className="text-primary mb-3">
                        <i className="fas fa-user me-2"></i>Informações do
                        Doador
                      </h6>
                      <div className="info-item mb-2">
                        <strong>Nome:</strong>
                        <span className="ms-2">
                          {agendamentoSelecionado.doador_nome ||
                            "Não informado"}
                        </span>
                      </div>
                      <div className="info-item mb-2">
                        <strong>Email:</strong>
                        <span className="ms-2">
                          {agendamentoSelecionado.doador_email ||
                            "Não informado"}
                        </span>
                      </div>
                      <div className="info-item mb-2">
                        <strong>Telefone:</strong>
                        <span className="ms-2">
                          {agendamentoSelecionado.doador_telefone ||
                            "Não informado"}
                        </span>
                      </div>
                      <div className="info-item">
                        <strong>Tipo Sanguíneo:</strong>
                        <span className="ms-2 badge bg-primary">
                          {agendamentoSelecionado.doador_tipo_sanguineo ||
                            "Não informado"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="detail-section mb-4">
                      <h6 className="text-primary mb-3">
                        <i className="fas fa-calendar me-2"></i>Informações do
                        Agendamento
                      </h6>
                      <div className="info-item mb-2">
                        <strong>Data:</strong>
                        <span className="ms-2 fw-bold text-success">
                          {agendamentoSelecionado.data}
                        </span>
                      </div>
                      <div className="info-item mb-2">
                        <strong>Tipo de Doação:</strong>
                        <span className="ms-2">
                          {getTipoDoacaoText(
                            agendamentoSelecionado.tipo_doacao
                          )}
                        </span>
                      </div>
                      <div className="info-item mb-2">
                        <strong>Status:</strong>
                        <span
                          className={`ms-2 ${getStatusBadge(
                            agendamentoSelecionado.status
                          )}`}
                        >
                          {getStatusText(agendamentoSelecionado.status)}
                        </span>
                      </div>
                      <div className="info-item">
                        <strong>ID do Agendamento:</strong>
                        <span className="ms-2 text-muted">
                          #{agendamentoSelecionado.id}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informações Adicionais */}
                <div className="detail-section">
                  <h6 className="text-primary mb-3">
                    <i className="fas fa-clipboard-list me-2"></i>Informações
                    Adicionais
                  </h6>
                  <div className="alert alert-light border">
                    <div className="row">
                      <div className="col-md-6">
                        <small>
                          <i className="fas fa-clock text-warning me-1"></i>
                          <strong>Horário Sugerido:</strong> 8h às 16h
                        </small>
                      </div>
                      <div className="col-md-6">
                        <small>
                          <i className="fas fa-map-marker-alt text-danger me-1"></i>
                          <strong>Local:</strong> Hemocentro Principal
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModalDetalhes(false)}
                >
                  <i className="fas fa-times me-1"></i>
                  Fechar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setShowModalDetalhes(false);
                    handleReagendar(agendamentoSelecionado);
                  }}
                  disabled={agendamentoSelecionado.status === "realizado"}
                >
                  <i className="fas fa-calendar-alt me-1"></i>
                  Reagendar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AgendamentosHemocentro;
