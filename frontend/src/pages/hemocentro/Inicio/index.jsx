import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Footer from "../../../components/Footer";
import { api } from "../../../services/api";
import "./styles.css";
import NavigationHemocentro from "../../../components/Navigation/NavigationHemocentro";

const HomeHemocentro = () => {
  const [dados, setDados] = useState(null);
  const [doadores, setDoadores] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [campanhas, setCampanhas] = useState([]);
  const [novaCampanha, setNovaCampanha] = useState({
    titulo: "",
    descricao: "",
    tipoSanguineo: "",
    dataFim: "",
    publicoAlvo: "todos",
  });
  const [showFormCampanha, setShowFormCampanha] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAgendamentos: 0,
    agendamentosHoje: 0,
    totalDoadores: 0,
    campanhasAtivas: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!api.isAuthenticated()) {
          navigate("/login/hemocentro");
          return;
        }

        const currentUser = api.getCurrentUser();
        console.log("🏥 DEBUG - Hemocentro atual:", currentUser);

        if (!currentUser || currentUser.tipo !== "hemocentro") {
          navigate("/login/hemocentro");
          return;
        }

        const hemocentroInfoResponse = await api.getHemocentroInfo();
        console.log("🏥 INFO HEMOCENTRO:", hemocentroInfoResponse);

        if (
          hemocentroInfoResponse.success &&
          hemocentroInfoResponse.data?.painel
        ) {
          const hemocentroData = hemocentroInfoResponse.data.painel;
          setDados({
            nome: hemocentroData.nome_instituicao || "Hemocentro Regional",
            endereco: `${hemocentroData.cidade || "Cidade"} - ${
              hemocentroData.estado || "Estado"
            }`,
            cidade: hemocentroData.cidade,
            estado: hemocentroData.estado,
          });
        } else {
          setDados({
            nome: currentUser.nome || "Hemocentro Regional",
            endereco: "Endereço não disponível",
          });
        }

        let doadoresData = [];
        try {
          const doadoresResponse = await api.getDoadores();
          console.log("👥 Doadores:", doadoresResponse);

          doadoresData =
            doadoresResponse.data?.doadores || doadoresResponse.doadores || [];
        } catch (error) {
          console.log("⚠️ API de doadores não disponível");
        }
        setDoadores(doadoresData);

        const agendamentosResponse = await api.getAgendamentosHemocentro();
        console.log("📅 RESPOSTA COMPLETA DA API:", agendamentosResponse);

        let agendamentosAtivos = [];
        if (agendamentosResponse.success && agendamentosResponse.agendamentos) {
          agendamentosAtivos = agendamentosResponse.agendamentos.filter(
            (ag) => ag.status !== "cancelado"
          );
        }

        console.log("✅ Agendamentos ativos filtrados:", agendamentosAtivos);
        setAgendamentos(agendamentosAtivos);

        let campanhasData = [];
        try {
          console.log("📢 Buscando campanhas do hemocentro...");

          const campanhasResponse = await api.getCampanhas();
          console.log("📢 RESPOSTA CAMPANHAS COMPLETA:", campanhasResponse);

          if (campanhasResponse.success) {
            const campanhasRaw =
              campanhasResponse.data?.campanhas ||
              campanhasResponse.campanhas ||
              [];

            campanhasData = campanhasRaw
              .filter((campanha) => {
                const pertenceAoHemocentro =
                  campanha.hemocentro_id === currentUser.id;

                const estaAtiva =
                  campanha.status === "ativa" ||
                  campanha.status === "Ativa" ||
                  campanha.ativo === true;

                console.log(`🔍 Campanha "${campanha.titulo}":`, {
                  pertenceAoHemocentro,
                  estaAtiva,
                  hemocentro_id: campanha.hemocentro_id,
                  currentUserId: currentUser.id,
                });

                return pertenceAoHemocentro && estaAtiva;
              })
              .map((campanha) => {
                return {
                  id: campanha.id,
                  titulo:
                    campanha.titulo || campanha.Titulo || "Campanha sem título",
                  descricao:
                    campanha.descricao || campanha.Descricao || "Sem descrição",
                  tipoSanguineo:
                    campanha.tipoSanguineo ||
                    campanha.tipo_sanguineo ||
                    "Todos",
                  dataFim:
                    campanha.dataFim ||
                    campanha.data_fim ||
                    campanha.data_final,
                  status: campanha.status || "ativa",
                  hemocentro_id: campanha.hemocentro_id,
                  local: campanha.local || `${currentUser.nome}`,
                };
              });
          }
        } catch (error) {
          console.error("❌ Erro ao buscar campanhas:", error);
        }

        console.log("📢 Campanhas dinâmicas FINAIS:", campanhasData);
        setCampanhas(campanhasData);

        const hoje = new Date();
        const hojeFormatado = hoje.toLocaleDateString("pt-BR");

        const agendamentosHoje = agendamentosAtivos.filter((ag) => {
          try {
            return ag.data === hojeFormatado;
          } catch (error) {
            console.error("Erro ao comparar datas:", error);
            return false;
          }
        }).length;

        setStats({
          totalAgendamentos: agendamentosAtivos.length,
          agendamentosHoje: agendamentosHoje,
          totalDoadores: doadoresData.length,
          campanhasAtivas: campanhasData.length,
        });
      } catch (error) {
        console.error("Erro ao carregar dados:", error);

        if (
          error.message.includes("token") ||
          error.message.includes("autenticação")
        ) {
          navigate("/login/hemocentro");
          return;
        }

        setDados({
          nome: "Hemocentro Regional",
          endereco: "Av. Principal, 1234 - Centro",
        });
        setDoadores([]);
        setAgendamentos([]);
        setCampanhas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleCriarCampanha = async (e) => {
    e.preventDefault();
    try {
      if (!api.isAuthenticated()) {
        alert("Sessão expirada. Faça login novamente.");
        navigate("/login/hemocentro");
        return;
      }

      const currentUser = api.getCurrentUser();

      const campanhaData = {
        titulo: novaCampanha.titulo,
        descricao: novaCampanha.descricao,
        tipo_sanguineo: novaCampanha.tipoSanguineo,
        data_fim: novaCampanha.dataFim,
        publico_alvo: novaCampanha.publicoAlvo,
        status: "ativa",
        local: `${currentUser.nome}`,
      };

      console.log("📤 Criando campanha:", campanhaData);

      const response = await api.criarCampanha(campanhaData);

      if (response.success) {
        console.log("✅ Campanha criada com sucesso:", response);

        const novaCampanhaCompleta = {
          id: response.campanhaId || Date.now(),
          titulo: novaCampanha.titulo,
          descricao: novaCampanha.descricao,
          tipoSanguineo: novaCampanha.tipoSanguineo,
          dataFim: novaCampanha.dataFim,
          status: "ativa",
          hemocentro_id: currentUser.id,
        };

        setCampanhas((prev) => [...prev, novaCampanhaCompleta]);

        setNovaCampanha({
          titulo: "",
          descricao: "",
          tipoSanguineo: "",
          dataFim: "",
          publicoAlvo: "todos",
        });
        setShowFormCampanha(false);

        setStats((prev) => ({
          ...prev,
          campanhasAtivas: prev.campanhasAtivas + 1,
        }));

        alert("Campanha criada com sucesso!");
      } else {
        throw new Error(response.message || "Erro ao criar campanha");
      }
    } catch (error) {
      console.error("Erro ao criar campanha:", error);
      alert("Erro ao criar campanha: " + error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovaCampanha({
      ...novaCampanha,
      [name]: value,
    });
  };

  const formatarData = (dataString) => {
    if (!dataString) return "Data não definida";

    try {
      if (dataString.includes("-")) {
        const [ano, mes, dia] = dataString.split("-");
        const data = new Date(ano, mes - 1, dia);
        return data.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }

      if (dataString.includes("/")) {
        const [dia, mes, ano] = dataString.split("/");
        const data = new Date(ano, mes - 1, dia);
        return data.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }

      return dataString;
    } catch (error) {
      console.error("Erro ao formatar data:", error, dataString);
      return dataString;
    }
  };

  const agendamentosOrdenados = [...agendamentos]
    .filter((ag) => {
      try {
        if (!ag.data) {
          return false;
        }

        if (ag.status !== "pendente") {
          return false;
        }

        const [dia, mes, ano] = ag.data.split("/");
        const dataAgendamento = new Date(ano, mes - 1, dia);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        return dataAgendamento >= hoje;
      } catch (error) {
        console.error("❌ Erro ao filtrar data:", error);
        return false;
      }
    })
    .sort((a, b) => {
      try {
        const [diaA, mesA, anoA] = a.data.split("/");
        const [diaB, mesB, anoB] = b.data.split("/");
        const dataA = new Date(anoA, mesA - 1, diaA);
        const dataB = new Date(anoB, mesB - 1, diaB);
        return dataA - dataB;
      } catch (error) {
        console.error("Erro ao ordenar datas:", error);
        return 0;
      }
    })
    .slice(0, 5);

  if (loading) {
    return (
      <div>
        <NavigationHemocentro />
        <div className="text-center mt-5 py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="mt-3">Carregando...</p>
        </div>
        <Footer />
      </div>
    );
  }

  const dadosSeguros = dados || {
    nome: "Hemocentro Regional",
    endereco: "Av. Principal, 1234 - Centro",
  };

  return (
    <div className="home-hemocentro">
      <NavigationHemocentro />

      <div className="container-fluid px-4 py-5">
        <div className="container">
          <div className="row mb-5">
            <div className="col-12">
              <div className="welcome-card card border-0 shadow-lg">
                <div className="card-body p-4">
                  <div className="row align-items-center">
                    <div className="col-md-8">
                      <h1 className="display-6 fw-bold text-primary mb-2">
                        Bem-vindo, {dadosSeguros.nome}!
                      </h1>
                      <p className="lead text-muted mb-3">
                        Gerencie suas operações de coleta e doadores de forma
                        eficiente.
                      </p>
                      <div className="d-flex flex-wrap gap-2">
                        <span className="badge bg-primary">
                          {stats.totalAgendamentos} Agendamentos
                        </span>
                        <span className="badge bg-success">
                          {stats.agendamentosHoje} Agendamentos Hoje
                        </span>
                        <span className="badge bg-warning">
                          {stats.totalDoadores} Doadores Ativos
                        </span>
                        <span className="badge bg-info">
                          {stats.campanhasAtivas} Campanhas Ativas
                        </span>
                      </div>
                    </div>
                    <div className="col-md-4 text-center">
                      <div className="avatar-section">
                        <div className="avatar-lg-doador mx-auto bg-light-primary text-danger rounded-circle d-flex align-items-center justify-content-center mb-3">
                          <i className="fas fa-id-card-alt fs-1"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-8">
              <div className="row mb-4">
                {[
                  {
                    icon: "fa-calendar-check",
                    color: "primary",
                    value: stats.totalAgendamentos,
                    label: "Total de Agendamentos",
                    link: "/hemocentro/agendamentos",
                  },
                  {
                    icon: "fa-calendar-day",
                    color: "success",
                    value: stats.agendamentosHoje,
                    label: "Agendamentos Hoje",
                    link: "/hemocentro/agendamentos",
                  },
                  {
                    icon: "fa-users",
                    color: "warning",
                    value: stats.totalDoadores,
                    label: "Doadores Ativos",
                    link: "/hemocentro/doadores",
                  },
                  {
                    icon: "fa-bullhorn",
                    color: "info",
                    value: stats.campanhasAtivas,
                    label: "Campanhas Ativas",
                    link: "/hemocentro/campanhas",
                  },
                ].map((item, idx) => (
                  <div key={idx} className="col-md-3 mb-3">
                    <div className="stat-card card border-0 shadow-sm h-100 text-center">
                      <div className="card-body">
                        <div className="stat-icon mb-3">
                          <i
                            className={`fas ${item.icon} fa-2x text-${item.color}`}
                          ></i>
                        </div>
                        <h4 className={`text-${item.color} fw-bold`}>
                          {item.value}
                        </h4>
                        <p className="text-muted small mb-2">{item.label}</p>
                        <Link
                          to={item.link}
                          className="btn btn-sm btn-outline-primary w-100"
                        >
                          Ver Detalhes
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div id="campanhas" className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <i className="fas fa-bullhorn me-2 text-info"></i>
                      Campanhas Ativas
                    </h5>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => navigate("/hemocentro/campanhas")}
                      >
                        <i className="fas fa-arrow-right me-1"></i>
                        Ver Campanhas
                      </button>
                    </div>
                  </div>
                </div>

                <div className="card-body">
                  {campanhas.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="fas fa-bullhorn fa-3x text-muted mb-3"></i>
                      <p className="text-muted">
                        Nenhuma campanha ativa no momento
                      </p>
                      <button
                        className="btn btn-primary"
                        onClick={() => navigate("/hemocentro/campanhas")}
                      >
                        <i className="fas fa-plus me-1"></i>
                        Criar Nova Campanha
                      </button>
                    </div>
                  ) : (
                    <div className="row">
                      {campanhas.map((campanha) => (
                        <div key={campanha.id} className="col-md-6 mb-3">
                          <div className="card campanha-card border-0 shadow-sm h-100">
                            <div className="card-body">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6 className="card-title mb-0 text-primary">
                                  {campanha.titulo}
                                </h6>
                                <span
                                  className={`badge ${
                                    campanha.status === "concluida"
                                      ? "bg-secondary"
                                      : "bg-success"
                                  }`}
                                >
                                  {campanha.status === "concluida"
                                    ? "Concluída"
                                    : "Ativa"}
                                </span>
                              </div>

                              <p className="card-text small text-muted mb-3">
                                {campanha.descricao}
                              </p>

                              <div className="d-flex justify-content-between small text-muted mb-3">
                                <span>
                                  <i className="fas fa-calendar me-1"></i>
                                  Até {formatarData(campanha.dataFim)}
                                </span>
                                <span>
                                  <i className="fas fa-map-marker-alt me-1"></i>
                                  {campanha.local || "Local não definido"}
                                </span>
                              </div>

                              <div className="text-center">
                                <button
                                  className="btn btn-outline-primary btn-sm w-100"
                                  onClick={() =>
                                    navigate("/hemocentro/campanhas")
                                  }
                                >
                                  <i className="fas fa-arrow-right me-1"></i>
                                  Gerenciar Campanha
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <i className="fas fa-calendar me-2 text-success"></i>
                      Próximos Agendamentos
                    </h5>
                    <Link
                      to="/hemocentro/agendamentos"
                      className="btn btn-sm btn-outline-success"
                    >
                      Ver Todos
                    </Link>
                  </div>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <small className="text-muted">
                      Total: {agendamentos.length} | Filtrados:{" "}
                      {agendamentosOrdenados.length}
                    </small>
                  </div>

                  {agendamentosOrdenados.length === 0 ? (
                    <div className="text-center py-3">
                      <i className="fas fa-calendar-times fa-2x text-muted mb-2"></i>
                      <p className="text-muted small">
                        Nenhum agendamento futuro
                      </p>
                    </div>
                  ) : (
                    agendamentosOrdenados.map((agendamento, index) => (
                      <div
                        key={agendamento.id || index}
                        className="agendamento-item mb-3 pb-3 border-bottom"
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-1">
                              {agendamento.doador_nome || "Doador"}
                            </h6>
                            <small className="text-muted">
                              {agendamento.data}
                            </small>
                          </div>
                          <span className="badge bg-primary">
                            {agendamento.tipo_doacao === "sangue_total"
                              ? "Sangue"
                              : agendamento.tipo_doacao}
                          </span>
                        </div>
                        <div className="mt-2">
                          <small
                            className={`badge bg-${
                              agendamento.status === "agendado"
                                ? "warning"
                                : agendamento.status === "confirmado"
                                ? "success"
                                : "secondary"
                            }`}
                          >
                            {agendamento.status === "agendado"
                              ? "Agendado"
                              : agendamento.status === "confirmado"
                              ? "Confirmado"
                              : agendamento.status}
                          </small>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <i className="fas fa-users me-2 text-warning"></i>
                      Doadores Ativos
                    </h5>
                    <Link
                      to="/hemocentro/doadores"
                      className="btn btn-sm btn-outline-warning"
                    >
                      Ver Todos
                    </Link>
                  </div>
                </div>

                <div className="card-body">
                  {doadores.length === 0 ? (
                    <div className="text-center py-3">
                      <i className="fas fa-user-times fa-2x text-muted mb-2"></i>
                      <p className="text-muted small">
                        Nenhum doador cadastrado
                      </p>
                    </div>
                  ) : (
                    doadores.slice(0, 3).map((doador, index) => {
                      const agendamentoAberto = agendamentos.some(
                        (ag) =>
                          ag.doador_id === doador.id &&
                          ["pendente", "agendado", "confirmado"].includes(
                            ag.status
                          )
                      );

                      const handleAgendamentoClick = () => {
                        navigate("/hemocentro/doadores", {
                          state: {
                            doadorId: doador.id,
                            reagendar: agendamentoAberto,
                          },
                        });
                      };

                      const handleContato = () => {
                        const numeroLimpo = doador.telefone
                          ? doador.telefone.replace(/\D/g, "")
                          : "";
                        if (numeroLimpo.length < 10) {
                          alert(
                            "Número de telefone inválido para este doador."
                          );
                          return;
                        }
                        window.open(`https://wa.me/55${numeroLimpo}`, "_blank");
                      };

                      return (
                        <div
                          key={index}
                          className="doador-item mb-3 pb-3 border-bottom"
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1">{doador.nome}</h6>
                              <small className="text-muted">
                                Tipo: {doador.tipo_sanguineo}
                              </small>
                            </div>
                            <span className="badge bg-primary">
                              {doador.tipo_sanguineo}
                            </span>
                          </div>

                          <div className="d-flex gap-1 mt-2">
                            <button
                              className="btn btn-sm btn-outline-success flex-fill"
                              onClick={handleContato}
                            >
                              <i className="fab fa-whatsapp"></i>
                            </button>

                            <button
                              className={`btn btn-sm flex-fill ${
                                agendamentoAberto
                                  ? "btn-outline-warning"
                                  : "btn-outline-primary"
                              }`}
                              onClick={handleAgendamentoClick}
                            >
                              <i
                                className={`fas ${
                                  agendamentoAberto
                                    ? "fa-calendar-alt"
                                    : "fa-calendar-plus"
                                } me-1`}
                              ></i>
                              {agendamentoAberto ? "Reagendar" : "Agendar"}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title mb-3">
                    <i className="fas fa-bolt me-2 text-info"></i>
                    Ações Rápidas
                  </h5>
                  <div className="d-grid gap-2">
                    <Link
                      to="/hemocentro/doadores"
                      className="btn btn-outline-success"
                    >
                      <i className="fas fa-users me-2"></i>Ver Doadores
                    </Link>
                    <Link
                      to="/hemocentro/agendamentos"
                      className="btn btn-outline-warning"
                    >
                      <i className="fas fa-calendar-check me-2"></i>
                      Agendamentos
                    </Link>
                    <button
                      className="btn btn-outline-info"
                      onClick={() => setShowFormCampanha(true)}
                    >
                      <i className="fas fa-bullhorn me-2"></i>Nova Campanha
                    </button>
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

export default HomeHemocentro;
