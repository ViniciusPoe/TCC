import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import NavigationDoador from "../../../components/Navigation/NavigationDoador";
import Footer from "../../../components/Footer";
import { api } from "../../../services/api";
import "./styles.css";
import { Collapse } from "bootstrap";

const HomeDoador = () => {
  const [dados, setDados] = useState(null);
  const [doacoes, setDoacoes] = useState([]);
  const [campanhas, setCampanhas] = useState([]);
  const [hemocentros, setHemocentros] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        console.log("🔄 DEBUG - Iniciando carregamento do dashboard...");

        if (!api.isAuthenticated()) {
          console.log("❌ Usuário não autenticado, redirecionando...");
          navigate("/login/doador");
          return;
        }

        const currentUser = api.getCurrentUser();
        console.log("🔄 DEBUG - Usuário atual:", currentUser);

        if (!currentUser || currentUser.tipo !== "doador") {
          console.log("❌ Tipo de usuário inválido, redirecionando...");
          navigate("/login/doador");
          return;
        }

        const [
          perfilResponse,
          historicoResponse,
          hemocentrosResponse,
          agendamentosResponse,
          campanhasResponse,
        ] = await Promise.all([
          api.getPerfilDoador(),
          api.getHistorico(),
          api.getHemocentros(),
          api.getAgendamentosDoador(),
          api.getCampanhasDoador(),
        ]);

        console.log("📦 DEBUG - PERFIL:", perfilResponse);
        console.log("📦 DEBUG - HISTÓRICO:", historicoResponse);
        console.log("📦 DEBUG - HEMOCENTROS:", hemocentrosResponse);
        console.log("📦 DEBUG - AGENDAMENTOS:", agendamentosResponse);
        console.log("📦 DEBUG - CAMPANHAS:", campanhasResponse);

        if (perfilResponse.success && perfilResponse.data) {
          const perfil =
            perfilResponse.data.doador ||
            perfilResponse.data.carteira ||
            perfilResponse.data;

          setDados(perfil);
        } else {
          throw new Error(perfilResponse.message || "Erro ao carregar perfil");
        }
        if (historicoResponse.success && historicoResponse.data?.doacoes) {
          setDoacoes(historicoResponse.data.doacoes.slice(0, 3));
        } else {
          setDoacoes([]);
        }

        if (campanhasResponse.success && campanhasResponse.data?.campanhas) {
          setCampanhas(campanhasResponse.data.campanhas.slice(0, 2));
        } else if (
          campanhasResponse.success &&
          Array.isArray(campanhasResponse.data)
        ) {
          setCampanhas(campanhasResponse.data.slice(0, 2));
        } else {
          setCampanhas([]);
        }

        if (
          hemocentrosResponse.success &&
          Array.isArray(hemocentrosResponse.data)
        ) {
          setHemocentros(hemocentrosResponse.data);
        } else {
          throw new Error(
            hemocentrosResponse.message || "Erro ao carregar hemocentros"
          );
        }

        if (
          agendamentosResponse.success &&
          agendamentosResponse.data?.agendamentos
        ) {
          setAgendamentos(agendamentosResponse.data.agendamentos);
        } else if (
          agendamentosResponse.success &&
          Array.isArray(agendamentosResponse.data)
        ) {
          setAgendamentos(agendamentosResponse.data);
        } else {
          setAgendamentos([]);
        }
      } catch (error) {
        console.error("❌ DEBUG - Erro ao carregar dados:", error);

        if (
          error.message.includes("token") ||
          error.message.includes("autenticação")
        ) {
          console.log("🔐 Token inválido, redirecionando...");
          navigate("/login/doador");
          return;
        }

        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const calcularProximaDoacao = () => {
    if (!agendamentos || agendamentos.length === 0) return null;

    const hoje = new Date();
    const hojeLimpo = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      hoje.getDate()
    );

    const futuros = agendamentos.filter((ag) => {
      if (!ag.data) return false;
      const [dia, mes, ano] = ag.data.split("/");
      const dataAg = new Date(ano, mes - 1, dia);
      return (
        dataAg >= hojeLimpo && ["agendado", "pendente"].includes(ag.status)
      );
    });

    if (futuros.length === 0) return null;

    return futuros.sort((a, b) => {
      const [dA, mA, aA] = a.data.split("/");
      const [dB, mB, aB] = b.data.split("/");
      return new Date(aA, mA - 1, dA) - new Date(aB, mB - 1, dB);
    })[0];
  };

  const calcularDiasAteProximaDoacao = () => {
    const proxima = calcularProximaDoacao();
    if (!proxima) return null;
    const hoje = new Date();
    const [dia, mes, ano] = proxima.data.split("/");
    const dataProx = new Date(ano, mes - 1, dia);
    const diff = dataProx - hoje;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const calcularEstatisticas = () => {
    const totalDoacoes = doacoes.length;
    const volumeTotal = doacoes.reduce((t, d) => t + d.volume, 0);
    const vidasSalvas = Math.round(volumeTotal / 350);

    let statusDoador = "Iniciante";
    let badgeClass = "bg-info";

    if (totalDoacoes >= 10) {
      statusDoador = "Doador Ouro";
      badgeClass = "bg-warning text-dark";
    } else if (totalDoacoes >= 5) {
      statusDoador = "Doador Prata";
      badgeClass = "bg-secondary";
    } else if (totalDoacoes >= 2) {
      statusDoador = "Doador Bronze";
      badgeClass = "bg-brown text-white";
    }

    return { totalDoacoes, volumeTotal, vidasSalvas, statusDoador, badgeClass };
  };

  const formatarVolume = (v) => `${v}ml`;

  const formatarData = (dataString) => {
    try {
      if (dataString && dataString.includes("/")) return dataString;
      const data = new Date(dataString);
      return data.toLocaleDateString("pt-BR");
    } catch {
      return "Data inválida";
    }
  };

  if (loading) {
    return (
      <div>
        <NavigationDoador />
        <div className="text-center mt-5 py-5">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="mt-3">Carregando dados...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <NavigationDoador />
        <div className="container-fluid px-4 py-5">
          <div className="container">
            <div className="alert alert-danger">
              <h4 className="alert-heading">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Erro ao carregar dados
              </h4>
              <p className="mb-3">{error}</p>
              <button
                className="btn btn-warning"
                onClick={() => window.location.reload()}
              >
                <i className="fas fa-redo me-1"></i> Tentar Novamente
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!dados) {
    return (
      <div>
        <NavigationDoador />
        <div className="container-fluid px-4 py-5 text-center">
          <div className="alert alert-warning">
            <h4 className="alert-heading">Dados não disponíveis</h4>
            <p>Não foi possível carregar as informações do perfil.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const estatisticas = calcularEstatisticas();
  const proximaDoacao = calcularProximaDoacao();
  const diasAteProxima = calcularDiasAteProximaDoacao();

  return (
    <div className="home-doador">
      <NavigationDoador />

      <div className="container-fluid px-4 py-5">
        <div className="container">
          <div className="row mb-5">
            <div className="col-12">
              <div className="welcome-card card border-0 shadow-lg">
                <div className="card-body p-4">
                  <div className="row align-items-center">
                    <div className="col-md-8">
                      <h1 className="display-6 fw-bold text-danger mb-2">
                        Olá, {dados?.nome ? dados.nome.split(" ")[0] : "Doador"}
                        !
                      </h1>
                      <p className="lead text-muted mb-3">
                        {proximaDoacao ? (
                          <>
                            Sua próxima doação está agendada para{" "}
                            <strong>{proximaDoacao.data}</strong>.
                          </>
                        ) : (
                          <>
                            Você ainda não tem doações agendadas. Que tal
                            agendar sua primeira doação?
                          </>
                        )}
                      </p>
                      <div className="d-flex flex-wrap gap-2">
                        <span className="badge bg-success">
                          {estatisticas.totalDoacoes} Doações Realizadas
                        </span>
                        <span className="badge bg-info">
                          {formatarVolume(estatisticas.volumeTotal)} Doados
                        </span>
                      </div>
                    </div>
                    <div className="col-md-4 text-center">
                      <div className="avatar-section">
                        <div className="avatar-lg mx-auto bg-light-danger text-primary rounded-circle d-flex align-items-center justify-content-center mb-3">
                          <i className="fas fa-id-card-alt fs-1"></i>
                        </div>
                        <p className="text-muted small">Tipo Sanguíneo</p>
                        <h4 className="text-danger fw-bold">
                          {dados?.tipo_sanguineo || "—"}
                        </h4>
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
                <div className="col-md-4 mb-3">
                  <div className="action-card card border-0 shadow-sm h-100 text-center">
                    <div className="card-body">
                      <div className="action-icon mb-3">
                        <i className="fas fa-calendar-plus fa-2x text-danger"></i>
                      </div>
                      <h5>Agendar Doação</h5>
                      <p className="text-muted small">
                        Marque sua próxima doação
                      </p>
                      <button
                        className="btn btn-danger btn-sm w-100"
                        onClick={() => navigate("/doador/agendamento")}
                      >
                        Agendar Agora
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-md-4 mb-3">
                  <div className="action-card card border-0 shadow-sm h-100 text-center">
                    <div className="card-body">
                      <div className="action-icon mb-3">
                        <i className="fas fa-history fa-2x text-primary"></i>
                      </div>
                      <h5>Ver Histórico</h5>
                      <p className="text-muted small">Acompanhe suas doações</p>
                      <Link
                        to="/doador/historico"
                        className="btn btn-outline-primary btn-sm w-100"
                      >
                        Ver Completo
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="col-md-4 mb-3">
                  <div className="action-card card border-0 shadow-sm h-100 text-center">
                    <div className="card-body">
                      <div className="action-icon mb-3">
                        <i className="fas fa-id-card fa-2x text-success"></i>
                      </div>
                      <h5>Minha Carteira</h5>
                      <p className="text-muted small">Documento do doador</p>
                      <Link
                        to="/doador/carteira"
                        className="btn btn-outline-success btn-sm w-100"
                      >
                        Ver Carteira
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <i className="fas fa-history me-2"></i>Últimas Doações
                    </h5>
                    <Link
                      to="/doador/historico"
                      className="btn btn-sm btn-outline-danger"
                    >
                      Ver Todas
                    </Link>
                  </div>
                </div>
                <div className="card-body">
                  {doacoes.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="fas fa-inbox fa-2x text-muted mb-3"></i>
                      <p className="text-muted">
                        Nenhuma doação realizada ainda
                      </p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Data</th>
                            <th>Local</th>
                            <th>Volume</th>
                          </tr>
                        </thead>
                        <tbody>
                          {doacoes.map((doacao, index) => (
                            <tr key={doacao.id || index}>
                              <td>
                                <strong>{formatarData(doacao.data)}</strong>
                              </td>
                              <td>
                                <div>
                                  <strong>
                                    {doacao.local || "Hemocentro"}
                                  </strong>
                                  <br />
                                  <small className="text-muted">
                                    Doação de sangue
                                  </small>
                                </div>
                              </td>
                              <td>{formatarVolume(doacao.volume)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-white">
                  <h5 className="mb-0">
                    <i className="fas fa-clock me-2"></i>Próxima Doação
                  </h5>
                </div>
                <div className="card-body text-center">
                  {proximaDoacao ? (
                    <>
                      <div className="next-donation-date mb-3">
                        <div className="display-6 fw-bold text-danger">
                          {proximaDoacao.data.split("/")[0]}
                        </div>
                        <div className="text-muted">
                          {new Date(
                            proximaDoacao.data.split("/")[2],
                            proximaDoacao.data.split("/")[1] - 1,
                            proximaDoacao.data.split("/")[0]
                          )
                            .toLocaleDateString("pt-BR", {
                              month: "long",
                              year: "numeric",
                            })
                            .toUpperCase()}
                        </div>
                      </div>
                      <div className="progress mb-3" style={{ height: "8px" }}>
                        <div
                          className="progress-bar bg-danger"
                          style={{
                            width: `${Math.max(
                              10,
                              100 - (diasAteProxima || 0) * 2
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <p className="small text-muted mb-3">
                        {diasAteProxima === 0 ? (
                          <strong>Sua doação é hoje!</strong>
                        ) : diasAteProxima === 1 ? (
                          <strong>Sua doação é amanhã!</strong>
                        ) : (
                          <>
                            Faltam <strong>{diasAteProxima} dias</strong> para
                            sua doação
                          </>
                        )}
                      </p>
                    </>
                  ) : (
                    <div className="text-center py-3">
                      <i className="fas fa-calendar-times fa-2x text-muted mb-3"></i>
                      <p className="small text-muted">
                        Nenhum agendamento futuro
                      </p>
                    </div>
                  )}
                  <button
                    className="btn btn-outline-danger btn-sm w-100"
                    onClick={() => navigate("/doador/agendamento")}
                  >
                    <i className="fas fa-bell me-1"></i>
                    {proximaDoacao ? "Alterar Agendamento" : "Agendar Doação"}
                  </button>
                </div>
              </div>

              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white">
                  <h5 className="mb-0">
                    <i className="fas fa-bullhorn me-2"></i>Campanhas Ativas
                  </h5>
                </div>
                <div className="card-body">
                  {campanhas.length === 0 ? (
                    <div className="text-center py-3">
                      <i className="fas fa-bullhorn fa-2x text-muted mb-2"></i>
                      <p className="small text-muted">
                        Nenhuma campanha ativa no momento
                      </p>
                    </div>
                  ) : (
                    <>
                      {campanhas.map((campanha) => (
                        <div
                          key={campanha.id}
                          className="campanha-item mb-3 pb-3 border-bottom"
                        >
                          <span className="badge bg-danger mb-2">
                            {campanha.status === "urgente"
                              ? "Urgente"
                              : "Ativa"}
                          </span>
                          <h6 className="small fw-bold">{campanha.titulo}</h6>
                          <p className="small text-muted mb-2">
                            {campanha.descricao}
                          </p>
                          <div className="d-flex justify-content-between align-items-center">
                            <small className="text-muted">
                              <i className="fas fa-map-marker-alt me-1"></i>
                              {campanha.local}
                            </small>
                            <Link
                              to="/doador/campanhas"
                              className="btn btn-sm btn-outline-danger"
                            >
                              Participar
                            </Link>
                          </div>
                        </div>
                      ))}
                      <Link
                        to="/doador/campanhas"
                        className="btn btn-sm btn-outline-primary w-100"
                      >
                        Ver todas as campanhas
                      </Link>
                    </>
                  )}
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

export default HomeDoador;
