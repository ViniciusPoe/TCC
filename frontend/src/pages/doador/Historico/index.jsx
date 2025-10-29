import React, { useState, useEffect } from "react";
import NavigationDoador from "../../../components/Navigation/NavigationDoador";
import Footer from "../../../components/Footer";
import { api } from "../../../services/api";
import "./styles.css";

const Historico = () => {
  const [doacoes, setDoacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estatisticas, setEstatisticas] = useState({
    totalDoacoes: 0,
    volumeTotal: 0,
    statusDoador: "Iniciante",
    metaAnual: 10,
    vidasSalvas: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.getHistorico();
        console.log("📊 Dados do histórico:", response);
        const lista = response.data?.doacoes || [];
        setDoacoes(lista);
        calcularEstatisticas(lista);
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calcularEstatisticas = (doacoes) => {
    const totalDoacoes = doacoes.length;
    const volumeTotal = doacoes.reduce(
      (total, doacao) => total + (doacao.volume || 450),
      0
    );

    // Calcular vidas salvas (cada 350ml pode salvar até 1 vida)
    const vidasSalvas = Math.round(volumeTotal / 350);

    // Determinar status do doador baseado no número de doações
    let statusDoador = "Iniciante";
    if (totalDoacoes >= 10) statusDoador = "Doador Ouro";
    else if (totalDoacoes >= 5) statusDoador = "Doador Prata";
    else if (totalDoacoes >= 2) statusDoador = "Doador Bronze";

    setEstatisticas({
      totalDoacoes,
      volumeTotal,
      statusDoador,
      metaAnual: 10,
      vidasSalvas,
    });
  };

  const calcularProgresso = () => {
    return Math.min(
      (estatisticas.totalDoacoes / estatisticas.metaAnual) * 100,
      100
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      realizada: {
        class: "bg-success bg-opacity-10 text-success",
        icon: "fa-check-circle",
        text: "Realizada",
      },
      processando: {
        class: "bg-warning bg-opacity-10 text-warning",
        icon: "fa-clock",
        text: "Processando",
      },
      agendado: {
        class: "bg-info bg-opacity-10 text-info",
        icon: "fa-calendar",
        text: "Agendado",
      },
      cancelado: {
        class: "bg-danger bg-opacity-10 text-danger",
        icon: "fa-times-circle",
        text: "Cancelado",
      },
      coletado: {
        class: "bg-primary bg-opacity-10 text-primary",
        icon: "fa-flask",
        text: "Coletado",
      },
      utilizado: {
        class: "bg-success bg-opacity-10 text-success",
        icon: "fa-check-circle",
        text: "Utilizado",
      },
    };

    const config = statusConfig[status] || statusConfig["processando"];

    return (
      <span className={`badge ${config.class}`}>
        <i className={`fas ${config.icon} me-1`}></i>
        {config.text}
      </span>
    );
  };

  const formatarVolume = (volume) => {
    return `${volume || 450}ml`;
  };

  const formatarData = (dataString) => {
    if (!dataString) return "Data não informada";

    try {
      let data;

      // 📅 Caso venha no formato brasileiro DD/MM/YYYY
      if (dataString.includes("/")) {
        const [dia, mes, ano] = dataString.split("/");
        data = new Date(`${ano}-${mes}-${dia}T00:00:00`);
      }
      // 📆 Caso venha no formato ISO (YYYY-MM-DD ou com hora)
      else {
        let dataNormalizada = dataString.trim();
        if (dataNormalizada.includes(" ")) {
          dataNormalizada = dataNormalizada.replace(" ", "T");
        }
        data = new Date(dataNormalizada);
      }

      if (isNaN(data.getTime())) {
        console.warn("⚠️ Data inválida recebida:", dataString);
        return "Data inválida";
      }

      return data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (err) {
      console.error("❌ Erro ao formatar data:", dataString, err);
      return "Data inválida";
    }
  };
  const formatarHora = (dataString, hora) => {
    if (hora) return hora; // usa se já existir campo "horario"
    try {
      const data = new Date(dataString);
      if (isNaN(data)) return "Horário não informado";
      return data.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Horário não informado";
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
          <p className="mt-3">Carregando histórico...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <NavigationDoador />
      <div className="container-fluid px-4 py-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-5">
            <div>
              <h1 className="display-5 fw-bold text-danger mb-2">
                <i className="fas fa-history me-3"></i>Histórico de Doações
              </h1>
              <p className="lead text-muted">
                Registro completo das suas contribuições para salvar vidas
              </p>
            </div>
            <div>
              <a href="/doador/agendamento" className="btn btn-danger">
                <i className="fas fa-plus-circle me-2"></i>Agendar Nova Doação
              </a>
            </div>
          </div>

          {/* Resumo Estatístico */}
          <div className="row mb-5">
            <div className="col-md-4 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <h3 className="text-danger">{estatisticas.totalDoacoes}</h3>
                  <p className="text-muted mb-0">Total de Doações</p>
                  <div className="progress mt-3" style={{ height: "6px" }}>
                    <div
                      className="progress-bar bg-danger"
                      style={{ width: `${calcularProgresso()}%` }}
                    ></div>
                  </div>
                  <small className="text-muted">
                    {Math.round(calcularProgresso())}% da meta anual (
                    {estatisticas.metaAnual} doações)
                  </small>
                </div>
              </div>
            </div>

            <div className="col-md-4 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <h3 className="text-danger">
                    {formatarVolume(estatisticas.volumeTotal)}
                  </h3>
                  <p className="text-muted mb-0">Volume Total Doado</p>
                  <p className="small text-success mt-2">
                    <i className="fas fa-check-circle"></i> Equivalente a{" "}
                    {estatisticas.vidasSalvas}{" "}
                    {estatisticas.vidasSalvas === 1
                      ? "vida salva"
                      : "vidas salvas"}
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-4 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <h3 className="text-danger">{estatisticas.statusDoador}</h3>
                  <p className="text-muted mb-0">Seu Status</p>
                  <div className="mt-2">
                    <span
                      className={`badge ${
                        estatisticas.statusDoador === "Doador Ouro"
                          ? "bg-warning text-dark"
                          : estatisticas.statusDoador === "Doador Prata"
                          ? "bg-secondary"
                          : estatisticas.statusDoador === "Doador Bronze"
                          ? "bg-brown text-white"
                          : "bg-info"
                      }`}
                    >
                      <i className="fas fa-award me-1"></i>
                      {estatisticas.totalDoacoes >= 5
                        ? "Frequente"
                        : estatisticas.totalDoacoes >= 2
                        ? "Regular"
                        : "Iniciante"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Doações */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white">
              <h5 className="mb-0">
                <i className="fas fa-list-check me-2"></i>
                Registro Completo ({doacoes.length} doações)
              </h5>
            </div>
            <div className="card-body p-0">
              {doacoes.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">Nenhuma doação encontrada</h5>
                  <p className="text-muted">
                    Você ainda não realizou nenhuma doação.
                  </p>
                  <a href="/doador/agendamento" className="btn btn-danger mt-3">
                    Agendar Primeira Doação
                  </a>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Data</th>
                        <th>Local</th>
                        <th>Volume</th>
                        <th>Tipo</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doacoes.map((doacao, index) => (
                        <tr key={doacao.id || index}>
                          <td>
                            <div>
                              <strong>
                                {formatarData(
                                  doacao.data_doacao || doacao.data
                                )}
                              </strong>
                              <br />
                              <small className="text-muted">
                                {formatarHora(
                                  doacao.data_doacao || doacao.data,
                                  doacao.horario
                                )}
                              </small>
                            </div>
                          </td>
                          <td>
                            <div>
                              <strong>
                                {doacao.local ||
                                  doacao.hemocentro_nome ||
                                  "Hemocentro"}
                              </strong>
                              {doacao.endereco && (
                                <>
                                  <br />
                                  <small className="text-muted">
                                    {doacao.endereco}
                                  </small>
                                </>
                              )}
                            </div>
                          </td>
                          <td>{formatarVolume(doacao.volume)}</td>
                          <td>
                            {doacao.tipo_doacao ||
                              doacao.tipo ||
                              "Sangue Total"}
                          </td>
                          <td>{getStatusBadge(doacao.status)}</td>
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
      <Footer />
    </div>
  );
};

export default Historico;
