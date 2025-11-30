import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavigationInstituicao from "../../../components/Navigation/NavigationHemocentro";
import Footer from "../../../components/Footer";
import { api } from "../../../services/api";
import "./styles.css";

const Doadores = () => {
  const [doadores, setDoadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("todos");
  const [showModalHistorico, setShowModalHistorico] = useState(false);
  const [showModalAgendar, setShowModalAgendar] = useState(false);
  const [doadorSelecionado, setDoadorSelecionado] = useState(null);
  const [historicoDoacoes, setHistoricoDoacoes] = useState([]);
  const [agendamentoData, setAgendamentoData] = useState({
    data: "",
    tipo_doacao: "sangue_total",
  });
  const [agendamentosPendentes, setAgendamentosPendentes] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!api.isAuthenticated()) {
          console.log("❌ Hemocentro não autenticado, redirecionando...");
          navigate("/login/hemocentro");
          return;
        }

        const currentUser = api.getCurrentUser();
        console.log("🏥 DEBUG - Hemocentro atual:", currentUser);

        if (!currentUser || currentUser.tipo !== "hemocentro") {
          console.log("❌ Tipo de usuário inválido, redirecionando...");
          navigate("/login/hemocentro");
          return;
        }

        console.log("🔄 Buscando doadores da API...");

        const response = await api.getDoadores();
        console.log("📊 Resposta COMPLETA da API:", response);

        if (response.success) {
          const lista = response.data?.doadores || response.doadores || [];

          setDoadores(lista);
          console.log("✅ Doadores recebidos:", lista);

          await carregarAgendamentosPendentesOtimizado();
        } else {
          console.error("❌ API não retornou dados válidos:", response);
          setDoadores([]);
        }
      } catch (error) {
        console.error("💥 Erro ao carregar doadores:", error);
        if (
          error.message.includes("token") ||
          error.message.includes("autenticação")
        ) {
          navigate("/login/hemocentro");
          return;
        }
        setDoadores([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);
  const carregarAgendamentosPendentesOtimizado = async () => {
    try {
      console.log("🔄 Buscando doadores com agendamentos ativos (GLOBAL)...");
      const response = await api.getDoadoresComAgendamentoGlobal();
      console.log("📅 Resposta doadores com agendamento GLOBAL:", response);

      const lista =
        response.data?.doadores || response.doadores || response.data || [];

      if (!response.success || lista.length === 0) {
        console.log(
          "ℹ️ Nenhum doador com agendamento ativo encontrado (GLOBAL)"
        );
        setAgendamentosPendentes({});
        return;
      }

      const agendamentosMap = {};
      lista.forEach((doador) => {
        agendamentosMap[doador.id] = {
          temAgendamento: true,
          data: doador.data_agendamento,
          tipo_doacao: doador.tipo_doacao_agendada,
          status: doador.status || "pendente",
        };
      });

      setAgendamentosPendentes(agendamentosMap);
      console.log(
        "✅ Agendamentos pendentes GLOBAL carregados:",
        agendamentosMap
      );
    } catch (error) {
      console.error(
        "❌ Erro ao carregar agendamentos pendentes GLOBAL:",
        error
      );
      setAgendamentosPendentes({});
    }
  };

  const temAgendamentoPendente = (doadorId) => {
    const agendamento = agendamentosPendentes[doadorId];
    if (!agendamento) return false;

    const ativo = ["agendado", "pendente"].includes(
      agendamento.status?.toLowerCase()
    );

    console.log(
      `🔍 Verificando doador ${doadorId}: status=${agendamento.status}, ativo=${ativo}`
    );
    return ativo;
  };

  const getTooltipAgendamento = (doadorId) => {
    const agendamento = agendamentosPendentes[doadorId];
    if (agendamento?.temAgendamento) {
      return `Já possui agendamento para ${agendamento.data} (${agendamento.tipo_doacao})`;
    }
    return "Agendar doação";
  };

  const carregarHistoricoDoacoes = async (doadorId) => {
    try {
      console.log(`📋 Buscando histórico do doador ${doadorId}...`);

      const response = await api.getHistoricoDoacoesDoador(doadorId);
      console.log("📦 Resposta bruta da API de histórico:", response);

      const lista =
        response.data?.doacoes || response.doacoes || response.historico || [];

      if (response.success && lista.length > 0) {
        const doacoesFormatadas = lista.map((d) => ({
          id: d.id,
          data: d.data || d.data_doacao,
          tipo_doacao: d.tipo_doacao,
          hemocentro:
            d.local || d.hemocentro_nome || d.hemocentro || "Hemocentro",
          status: d.status || "indefinido",
        }));

        setHistoricoDoacoes(doacoesFormatadas);
        console.log("🩸 Histórico carregado:", doacoesFormatadas);
      } else {
        console.warn("⚠️ Nenhum histórico retornado da API.");
        setHistoricoDoacoes([]);
      }
    } catch (error) {
      console.error("💥 Erro ao carregar histórico:", error);
      setHistoricoDoacoes([]);
    }
  };

  const handleAbrirHistorico = async (doador) => {
    setDoadorSelecionado(doador);
    await carregarHistoricoDoacoes(doador.id);
    setShowModalHistorico(true);
  };

  const handleAbrirAgendar = (doador) => {
    if (!doador.apto) {
      alert("Este doador não está apto para doação no momento.");
      return;
    }

    if (temAgendamentoPendente(doador.id)) {
      const agendamento = agendamentosPendentes[doador.id];
      alert(
        `❌ AGENDAMENTO BLOQUEADO\n\nDoador: ${doador.nome}\nJá possui agendamento para: ${agendamento.data}\nTipo: ${agendamento.tipo_doacao}\n\nPara agendar nova doação, primeiro cancele ou conclua o agendamento existente.`
      );
      return;
    }

    setDoadorSelecionado(doador);
    setAgendamentoData({
      data: "",
      tipo_doacao: "sangue_total",
    });
    setShowModalAgendar(true);
  };

  const handleAbrirWhatsApp = (doador) => {
    const numero = doador.telefone.replace(/\D/g, "");
    const currentUser = api.getCurrentUser();
    const nomeHemocentro = currentUser?.nome || "Nosso Hemocentro";

    const mensagem = `Olá ${doador.nome}! Somos do ${nomeHemocentro} e estamos entrando em contato com você para saber sua disponibilidade para agendar uma doação de sangue.`;

    const url = `https://wa.me/55${numero}?text=${encodeURIComponent(
      mensagem
    )}`;
    window.open(url, "_blank");
  };

  const handleConfirmarAgendamento = async () => {
    if (!doadorSelecionado || !agendamentoData.data) {
      alert("Por favor, selecione uma data para o agendamento.");
      return;
    }

    try {
      if (!api.isAuthenticated()) {
        alert("Sessão expirada. Faça login novamente.");
        navigate("/login/hemocentro");
        return;
      }

      // 👇 pega o hemocentro logado
      const currentUser = api.getCurrentUser();
      const hemocentroId = currentUser?.id;

      if (!hemocentroId) {
        alert("Não foi possível identificar o hemocentro logado.");
        return;
      }

      const agendamentoDataEnvio = {
        data: agendamentoData.data,
        tipo_doacao: agendamentoData.tipo_doacao || "sangue_total",
        doador_id: doadorSelecionado.id,
        hemocentro_id: hemocentroId,
      };

      console.log("📤 Enviando agendamento:", agendamentoDataEnvio);

      const response = await api.fazerAgendamento(agendamentoDataEnvio);

      if (response.success) {
        alert(
          `Agendamento confirmado para ${doadorSelecionado.nome} no dia ${agendamentoData.data}`
        );

        const updatedResponse = await api.getDoadores();
        if (updatedResponse.success) {
          setDoadores(updatedResponse.doadores);
          await carregarAgendamentosPendentesOtimizado();
        }

        setShowModalAgendar(false);
        setDoadorSelecionado(null);
      } else {
        throw new Error(response.message || "Erro ao agendar");
      }
    } catch (error) {
      console.error("Erro ao agendar:", error);
      alert(`Erro ao realizar agendamento: ${error.message}`);
    }
  };

  const doadoresFiltrados = doadores.filter((doador) => {
    const temAgendamento = temAgendamentoPendente(doador.id);

    if (filtro === "todos") return true;

    if (filtro === "aptos") {
      return doador.apto && !temAgendamento;
    }

    if (filtro === "inaptos") {
      return !doador.apto || temAgendamento;
    }

    return true;
  });

  const estatisticas = {
    total: doadores.length,

    aptos: doadores.filter((d) => d.apto && !temAgendamentoPendente(d.id))
      .length,

    inaptos: doadores.filter((d) => !d.apto || temAgendamentoPendente(d.id))
      .length,
  };
  
  const getFrequenciaBadge = (frequencia) => {
    switch (frequencia) {
      case "Frequente":
        return "badge bg-success";
      case "Novo":
        return "badge bg-info";
      case "Ocasional":
        return "badge bg-warning";
      default:
        return "badge bg-secondary";
    }
  };

  const getAptoBadge = (apto) => {
    return apto ? "badge bg-success" : "badge bg-danger";
  };

  const getAptoText = (apto) => {
    return apto ? "Apto" : "Inapto";
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Realizada":
        return "badge bg-success";
      case "Agendada":
        return "badge bg-warning";
      case "Cancelada":
        return "badge bg-danger";
      default:
        return "badge bg-secondary";
    }
  };

  const getAgendamentoBadge = (doadorId) => {
    if (temAgendamentoPendente(doadorId)) {
      return "badge bg-warning";
    }
    return "badge bg-secondary d-none";
  };

  if (loading) {
    return (
      <div>
        <NavigationInstituicao />
        <div className="text-center mt-5 py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="mt-3">Carregando doadores...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="doadores-page">
      <NavigationInstituicao />

      <div className="container-fluid px-4 py-5">
        <div className="container">
          <div className="row mb-5">
            <div className="col-12">
              <div className="text-center">
                <h1 className="display-5 fw-bold text-primary mb-2">
                  <i className="fas fa-users me-3"></i>Doadores
                </h1>
                <p className="lead text-muted">
                  Gerencie os doadores cadastrados no sistema
                </p>
              </div>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-md-4 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <i className="fas fa-users fa-2x text-primary mb-3"></i>
                  <h3 className="text-primary">{estatisticas.total}</h3>
                  <p className="text-muted mb-0">Total de Doadores</p>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <i className="fas fa-check-circle fa-2x text-success mb-3"></i>
                  <h3 className="text-success">{estatisticas.aptos}</h3>
                  <p className="text-muted mb-0">Doadores Aptos</p>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <i className="fas fa-clock fa-2x text-warning mb-3"></i>
                  <h3 className="text-warning">{estatisticas.inaptos}</h3>
                  <p className="text-muted mb-0">Doadores Inaptos</p>
                </div>
              </div>
            </div>
          </div>

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
                            filtro === "todos"
                              ? "btn-primary"
                              : "btn-outline-primary"
                          }`}
                          onClick={() => setFiltro("todos")}
                        >
                          Todos ({estatisticas.total})
                        </button>
                        <button
                          type="button"
                          className={`btn ${
                            filtro === "aptos"
                              ? "btn-success"
                              : "btn-outline-success"
                          }`}
                          onClick={() => setFiltro("aptos")}
                        >
                          Aptos ({estatisticas.aptos})
                        </button>
                        <button
                          type="button"
                          className={`btn ${
                            filtro === "inaptos"
                              ? "btn-warning"
                              : "btn-outline-warning"
                          }`}
                          onClick={() => setFiltro("inaptos")}
                        >
                          Inaptos ({estatisticas.inaptos})
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white">
                  <h5 className="mb-0">
                    <i className="fas fa-list me-2"></i>
                    Lista de Doadores ({doadoresFiltrados.length})
                  </h5>
                </div>
                <div className="card-body p-0">
                  {doadoresFiltrados.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="fas fa-user-times fa-4x text-muted mb-3"></i>
                      <h5 className="text-muted">Nenhum doador encontrado</h5>
                      <p className="text-muted">
                        {filtro === "todos"
                          ? "Não há doadores cadastrados no sistema"
                          : `Nenhum doador com status "${filtro}"`}
                      </p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Doador</th>
                            <th>Tipo Sanguíneo</th>
                            <th>Última Doação</th>
                            <th>Próxima Doação</th>
                            <th>Contato</th>
                            <th>Frequência</th>
                            <th>Status</th>
                            <th>Agendamento</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {doadoresFiltrados.map((doador) => (
                            <tr key={doador.id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3">
                                    {doador.nome.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <strong>{doador.nome}</strong>
                                    <br />
                                    <small className="text-muted">
                                      {doador.email}
                                    </small>
                                    <br />
                                    {temAgendamentoPendente(doador.id) && (
                                      <span
                                        className={getAgendamentoBadge(
                                          doador.id
                                        )}
                                      >
                                        <i className="fas fa-calendar-check me-1"></i>
                                        Agendado
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="badge bg-primary rounded-pill px-3 py-2">
                                  {doador.tipo_sanguineo}
                                </span>
                              </td>
                              <td>
                                <small>{doador.ultima_doacao}</small>
                              </td>
                              <td>
                                <small
                                  className={
                                    doador.apto
                                      ? "text-success fw-bold"
                                      : "text-warning"
                                  }
                                >
                                  {doador.proxima_doacao}
                                </small>
                              </td>
                              <td>
                                <small>{doador.telefone}</small>
                              </td>
                              <td>
                                <span
                                  className={getFrequenciaBadge(
                                    doador.frequencia
                                  )}
                                >
                                  {doador.frequencia}
                                </span>
                              </td>

                              <td>
                                <span className={getAptoBadge(doador.apto)}>
                                  {getAptoText(doador.apto)}
                                </span>
                              </td>

                              {/* NOVA COLUNA - "Agendamento" */}
                              <td>
                                {temAgendamentoPendente(doador.id) ? (
                                  <span className="badge bg-warning">Sim</span>
                                ) : (
                                  <span className="badge bg-secondary">
                                    Não
                                  </span>
                                )}
                              </td>

                              <td>
                                <div className="btn-group">
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    title="Contato"
                                    onClick={() => handleAbrirWhatsApp(doador)}
                                  >
                                    <i className="fas fa-phone"></i>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-success"
                                    title={getTooltipAgendamento(doador.id)}
                                    disabled={
                                      !doador.apto ||
                                      temAgendamentoPendente(doador.id)
                                    }
                                    onClick={() => handleAbrirAgendar(doador)}
                                    style={{
                                      opacity:
                                        !doador.apto ||
                                        temAgendamentoPendente(doador.id)
                                          ? 0.5
                                          : 1,
                                      cursor:
                                        !doador.apto ||
                                        temAgendamentoPendente(doador.id)
                                          ? "not-allowed"
                                          : "pointer",
                                    }}
                                  >
                                    <i className="fas fa-calendar-plus"></i>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-info"
                                    title="Histórico"
                                    onClick={() => handleAbrirHistorico(doador)}
                                  >
                                    <i className="fas fa-history"></i>
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
      {showModalHistorico && doadorSelecionado && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title">
                  <i className="fas fa-history me-2"></i>
                  Histórico de Doações - {doadorSelecionado.nome}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModalHistorico(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="info-item">
                      <strong>Tipo Sanguíneo:</strong>
                      <span className="ms-2 badge bg-primary">
                        {doadorSelecionado.tipo_sanguineo}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="info-item">
                      <strong>Status:</strong>
                      <span
                        className={`ms-2 ${getAptoBadge(
                          doadorSelecionado.apto
                        )}`}
                      >
                        {getAptoText(doadorSelecionado.apto)}
                      </span>
                    </div>
                  </div>
                </div>

                {historicoDoacoes.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <h6 className="text-muted">Nenhuma doação registrada</h6>
                    <p className="text-muted small">
                      Este doador ainda não realizou nenhuma doação.
                    </p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead className="table-light">
                        <tr>
                          <th>Data</th>
                          <th>Tipo de Doação</th>
                          <th>Hemocentro</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historicoDoacoes.map((doacao) => (
                          <tr key={doacao.id}>
                            <td>
                              <strong>{doacao.data}</strong>
                            </td>
                            <td>{doacao.tipo_doacao}</td>
                            <td>
                              <small className="text-muted">
                                {doacao.hemocentro}
                              </small>
                            </td>
                            <td>
                              <span className={getStatusBadge(doacao.status)}>
                                {doacao.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-4 p-3 bg-light rounded">
                  <h6 className="text-primary mb-2">
                    <i className="fas fa-chart-line me-2"></i>Estatísticas
                  </h6>
                  <div className="row text-center">
                    <div className="col-4">
                      <div className="border-end">
                        <h5 className="text-primary mb-1">
                          {historicoDoacoes.length}
                        </h5>
                        <small className="text-muted">Total de Doações</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="border-end">
                        <h5 className="text-success mb-1">
                          {
                            historicoDoacoes.filter(
                              (d) => d.status?.toLowerCase() === "realizada"
                            ).length
                          }
                        </h5>
                        <small className="text-muted">Realizadas</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <h5 className="text-info mb-1">
                        {doadorSelecionado.frequencia}
                      </h5>
                      <small className="text-muted">Frequência</small>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModalHistorico(false)}
                >
                  <i className="fas fa-times me-1"></i>
                  Fechar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setShowModalHistorico(false);
                    handleAbrirAgendar(doadorSelecionado);
                  }}
                  disabled={
                    !doadorSelecionado.apto ||
                    temAgendamentoPendente(doadorSelecionado.id) // 👈 aqui entra a trava
                  }
                  title={
                    temAgendamentoPendente(doadorSelecionado.id)
                      ? "Doador já possui agendamento ativo"
                      : "Agendar nova doação"
                  }
                >
                  <i className="fas fa-calendar-plus me-1"></i>
                  Agendar Doação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModalAgendar && doadorSelecionado && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">
                  <i className="fas fa-calendar-plus me-2"></i>
                  Agendar Doação - {doadorSelecionado.nome}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModalAgendar(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Doador</label>
                  <input
                    type="text"
                    className="form-control"
                    value={doadorSelecionado.nome}
                    readOnly
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Tipo Sanguíneo</label>
                  <input
                    type="text"
                    className="form-control"
                    value={doadorSelecionado.tipo_sanguineo}
                    readOnly
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Data da Doação *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={agendamentoData.data}
                    onChange={(e) =>
                      setAgendamentoData({
                        ...agendamentoData,
                        data: e.target.value,
                      })
                    }
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                  <small className="text-muted">
                    O horário será definido automaticamente pelo hemocentro
                  </small>
                </div>

                <div className="alert alert-info">
                  <h6>
                    <i className="fas fa-info-circle me-2"></i>Informações
                  </h6>
                  <small>
                    • Doador{" "}
                    {doadorSelecionado.apto ? "está apto" : "NÃO está apto"}{" "}
                    para doação
                    <br />• {doadorSelecionado.proxima_doacao}
                    <br />• Última doação: {doadorSelecionado.ultima_doacao}
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModalAgendar(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleConfirmarAgendamento}
                  disabled={!agendamentoData.data}
                >
                  <i className="fas fa-calendar-check me-1"></i>
                  Confirmar Agendamento
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

export default Doadores;
