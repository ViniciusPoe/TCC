import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavigationDoador from "../../../components/Navigation/NavigationDoador";
import Footer from "../../../components/Footer";
import { api } from "../../../services/api";
import "./styles.css";

const Agendamento = () => {
  const [formData, setFormData] = useState({
    data: "",
    tipo_doacao: "sangue_total",
    hemocentro_id: "",
  });
  const [hemocentros, setHemocentros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [agendamentoExistente, setAgendamentoExistente] = useState(null);
  const [modoReagendamento, setModoReagendamento] = useState(false);
  const [loadingReagendamento, setLoadingReagendamento] = useState(false);
  const [inapto, setInapto] = useState(false);
  const [diasRestantes, setDiasRestantes] = useState(0);
  const [dataUltimaDoacao, setDataUltimaDoacao] = useState(null);

  const navigate = useNavigate();

  const calcularDiasEntreDatas = (data1, data2) => {
    const d1 = new Date(data1.getFullYear(), data1.getMonth(), data1.getDate());
    const d2 = new Date(data2.getFullYear(), data2.getMonth(), data2.getDate());

    const umDia = 24 * 60 * 60 * 1000;
    const diffMs = d1 - d2;

    return Math.floor(Math.abs(diffMs / umDia));
  };

  const parseData = (dataStr) => {
    if (!dataStr) return null;

    if (dataStr instanceof Date) return dataStr;

    if (typeof dataStr === "string") {
      if (dataStr.includes("/")) {
        const [dia, mes, ano] = dataStr.split("/");
        return new Date(ano, mes - 1, dia);
      }

      return new Date(dataStr);
    }

    return null;
  };

  const verificarInaptidao = (ultimaDoacaoData) => {
    if (!ultimaDoacaoData) {
      return { inapto: false, diasRestantes: 0 };
    }

    const hoje = new Date();
    const hojeSemHora = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      hoje.getDate()
    );

    const dataUltimaDoacao = parseData(ultimaDoacaoData);

    if (!dataUltimaDoacao || isNaN(dataUltimaDoacao.getTime())) {
      console.warn("⚠️ Data de última doação inválida:", ultimaDoacaoData);
      return { inapto: false, diasRestantes: 0 };
    }

    const ultimaSemHora = new Date(
      dataUltimaDoacao.getFullYear(),
      dataUltimaDoacao.getMonth(),
      dataUltimaDoacao.getDate()
    );

    const umDia = 24 * 60 * 60 * 1000;

    const proximaDoacao = new Date(ultimaSemHora);
    proximaDoacao.setDate(proximaDoacao.getDate() + 90);

    const diffMs = proximaDoacao - hojeSemHora;
    const diasRestantes = Math.ceil(diffMs / umDia);

    if (diasRestantes > 0) {
      return { inapto: true, diasRestantes };
    }

    return { inapto: false, diasRestantes: 0 };
  };

  const formatarDataExtenso = (data) => {
    const dataObj = parseData(data);

    if (!dataObj || isNaN(dataObj.getTime())) {
      console.warn("⚠️ Data inválida em formatarDataExtenso:", data);
      return "Data inválida";
    }

    return dataObj.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
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

        try {
          const historicoResponse = await api.getHistorico();
          console.log("📋 Histórico bruto recebido da API:", historicoResponse);

          if (historicoResponse.success && historicoResponse.data?.doacoes) {
            const doacoes = historicoResponse.data.doacoes;

            console.log(`📊 Total de doações encontradas: ${doacoes.length}`);

            const doacoesOrdenadas = [...doacoes]
              .filter((d) => d.data)
              .sort((a, b) => parseData(b.data) - parseData(a.data));

            if (doacoesOrdenadas.length > 0) {
              const ultimaDoacao = doacoesOrdenadas[0];
              console.log("🩸 Última doação considerada:", ultimaDoacao);

              const { inapto: estaInapto, diasRestantes } = verificarInaptidao(
                ultimaDoacao.data
              );

              console.log(
                `🔎 Resultado da verificação de inaptidão: ${
                  estaInapto ? "INAPTO" : "APTO"
                } (dias restantes: ${diasRestantes})`
              );

              if (estaInapto) {
                setInapto(true);
                setDiasRestantes(diasRestantes);
                setDataUltimaDoacao(ultimaDoacao.data);
                setLoading(false);

                console.warn(
                  `⏳ Doador marcado como INAPTO (${diasRestantes} dias restantes)`
                );
                return;
              }
            } else {
              console.log("⚠️ Nenhuma doação encontrada no histórico.");
            }
          } else {
            console.log(
              "⚠️ Nenhuma lista de doações encontrada na resposta de histórico."
            );
          }
        } catch (error) {
          console.log("ℹ️ Erro ao obter histórico:", error);
        }

        const agendamentosResponse = await api.getAgendamentosDoador();
        console.log("📋 Agendamentos do usuário:", agendamentosResponse);

        const listaAgendamentos =
          agendamentosResponse.agendamentos ||
          agendamentosResponse.data?.agendamentos ||
          [];

        if (agendamentosResponse.success && listaAgendamentos.length > 0) {
          const agora = new Date();
          const hoje = new Date(
            agora.getFullYear(),
            agora.getMonth(),
            agora.getDate()
          );

          const agendamentoAtivo = listaAgendamentos.find((ag) => {
            if (!ag.data) return false;
            let dataAgendamento;
            try {
              if (ag.data.includes("-")) {
                const [ano, mes, dia] = ag.data.split("-");
                dataAgendamento = new Date(ano, mes - 1, dia);
              } else {
                const [dia, mes, ano] = ag.data.split("/");
                dataAgendamento = new Date(ano, mes - 1, dia);
              }
            } catch (e) {
              return false;
            }

            const dataSemHora = new Date(
              dataAgendamento.getFullYear(),
              dataAgendamento.getMonth(),
              dataAgendamento.getDate()
            );

            const dataValida = dataSemHora >= hoje;
            const statusValido =
              ag.status === "agendado" || ag.status === "pendente";

            return dataValida && statusValido;
          });

          if (agendamentoAtivo) {
            setAgendamentoExistente(agendamentoAtivo);

            const hemocentrosResponse = await api.getHemocentros();
            if (
              hemocentrosResponse.success &&
              (hemocentrosResponse.hemocentros || hemocentrosResponse.data)
            ) {
              setHemocentros(
                hemocentrosResponse.hemocentros || hemocentrosResponse.data
              );
            }

            setLoading(false);
            return;
          }
        }

        const response = await api.getHemocentros();
        console.log("📋 Resposta da API de hemocentros:", response);

        const hemocentrosData = response.data || response.hemocentros || [];

        if (response.success && hemocentrosData.length > 0) {
          setHemocentros(hemocentrosData);
        } else {
          setError("Nenhum hemocentro cadastrado no momento");
          setHemocentros([]);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        setError("Erro ao carregar dados");
        setHemocentros([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (inapto && !loading) {
    return (
      <div>
        <NavigationDoador />
        <div className="container-fluid px-4 py-5">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="text-center mb-5">
                  <h1 className="display-5 fw-bold text-warning mb-3">
                    <i className="fas fa-clock me-3"></i>
                    Aguarde para sua próxima doação
                  </h1>
                  <p className="lead text-muted">
                    Sua solidariedade é admirável, mas sua segurança vem
                    primeiro
                  </p>
                </div>

                <div className="card border-0 shadow-lg">
                  <div className="card-header bg-warning text-white py-4">
                    <div className="text-center">
                      <i className="fas fa-heartbeat fa-3x mb-3"></i>
                      <h3 className="mb-0">Período de Espera Necessário</h3>
                    </div>
                  </div>
                  <div className="card-body p-5">
                    <div className="row text-center">
                      <div className="col-md-6 mb-4">
                        <div className="info-card">
                          <i className="fas fa-calendar-times fa-2x text-warning mb-3"></i>
                          <h5>Última Doação</h5>
                          <p className="fw-bold text-primary fs-5">
                            {formatarDataExtenso(dataUltimaDoacao)}
                          </p>
                        </div>
                      </div>
                      <div className="col-md-6 mb-4">
                        <div className="info-card">
                          <i className="fas fa-hourglass-half fa-2x text-warning mb-3"></i>
                          <h5>Tempo Restante</h5>
                          <p className="fw-bold text-danger fs-4">
                            {diasRestantes}{" "}
                            {diasRestantes === 1 ? "dia" : "dias"}
                          </p>
                          <small className="text-muted">
                            até a próxima doação
                          </small>
                        </div>
                      </div>
                    </div>

                    <div className="alert alert-info mt-4">
                      <h6>
                        <i className="fas fa-info-circle me-2"></i>
                        Por que esse período de espera?
                      </h6>
                      <p className="mb-3">
                        O intervalo de 90 dias entre as doações de sangue é uma
                        recomendação da
                        <strong> Organização Mundial da Saúde (OMS)</strong> e
                        da
                        <strong>
                          {" "}
                          Agência Nacional de Vigilância Sanitária (ANVISA)
                        </strong>{" "}
                        para garantir:
                      </p>
                      <ul className="mb-0">
                        <li>
                          <strong>Recuperação completa do organismo:</strong>{" "}
                          Seu corpo precisa repor os glóbulos vermelhos e outros
                          componentes do sangue
                        </li>
                        <li>
                          <strong>Manutenção da sua saúde:</strong> Evita anemia
                          e outros problemas relacionados à frequência excessiva
                          de doações
                        </li>
                        <li>
                          <strong>Qualidade do sangue doado:</strong> Garante
                          que o sangue coletado seja de melhor qualidade para os
                          pacientes
                        </li>
                      </ul>
                    </div>

                    <div className="text-center mt-5">
                      <button
                        className="btn btn-primary btn-lg me-3"
                        onClick={() => navigate("/doador/inicio")}
                      >
                        <i className="fas fa-home me-2"></i>
                        Voltar para o Início
                      </button>
                      <button
                        className="btn btn-outline-secondary btn-lg"
                        onClick={() => navigate("/doador/historico")}
                      >
                        <i className="fas fa-history me-2"></i>
                        Ver Meu Histórico
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
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!api.isAuthenticated()) {
      alert("Sessão expirada. Faça login novamente.");
      navigate("/login/doador");
      return;
    }

    if (!formData.hemocentro_id) {
      alert("Por favor, selecione um hemocentro");
      return;
    }

    try {
      console.log("📤 Enviando agendamento:", formData);

      const response = await api.fazerAgendamento(formData);
      if (response.success) {
        alert("Agendamento realizado com sucesso!");
        navigate("/doador/inicio");
      } else {
        alert("Erro ao agendar: " + response.message);
      }
    } catch (error) {
      console.error("Erro no agendamento:", error);
      alert("Erro ao conectar com o servidor");
    }
  };

  const handleCancelarAgendamento = async () => {
    if (!agendamentoExistente) return;

    const confirmacao = window.confirm(
      "Tem certeza que deseja cancelar este agendamento?"
    );

    if (!confirmacao) return;

    try {
      const response = await api.cancelarAgendamento(agendamentoExistente.id);
      if (response.success) {
        alert("Agendamento cancelado com sucesso!");
        window.location.reload();
      } else {
        alert("Erro ao cancelar agendamento: " + response.message);
      }
    } catch (error) {
      console.error("Erro ao cancelar agendamento:", error);
      alert("Erro ao conectar com o servidor");
    }
  };

  const handleReagendarDoacao = async () => {
    if (!agendamentoExistente) return;

    const confirmacao = window.confirm(
      "Deseja reagendar sua doação? O agendamento atual será cancelado e você poderá escolher uma nova data."
    );

    if (!confirmacao) return;

    setLoadingReagendamento(true);

    try {
      const cancelResponse = await api.cancelarAgendamento(
        agendamentoExistente.id
      );

      if (cancelResponse.success) {
        console.log("✅ Agendamento anterior cancelado com sucesso");

        const hemocentrosResponse = await api.getHemocentros();

        if (
          hemocentrosResponse.success &&
          (hemocentrosResponse.data || hemocentrosResponse.hemocentros)
        ) {
          const lista =
            hemocentrosResponse.data || hemocentrosResponse.hemocentros || [];
          setHemocentros(lista);

          const hemocentroAnterior = lista.find(
            (h) => h.id === agendamentoExistente.hemocentro_id
          );

          if (hemocentroAnterior) {
            setFormData((prev) => ({
              ...prev,
              hemocentro_id: hemocentroAnterior.id,
            }));
          }

          setModoReagendamento(true);
          setAgendamentoExistente(null);

          alert(
            "Agendamento anterior cancelado. Agora você pode escolher uma nova data!"
          );
        } else {
          alert("Erro ao carregar hemocentros para reagendamento.");
        }
      } else {
        alert(
          "Erro ao cancelar agendamento anterior: " + cancelResponse.message
        );
      }
    } catch (error) {
      console.error("Erro no reagendamento:", error);
      alert("Erro ao processar reagendamento.");
    } finally {
      setLoadingReagendamento(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const formatarData = (dataString) => {
    const data = parseData(dataString);

    if (!data || isNaN(data.getTime())) return dataString || "Data inválida";

    return data.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const voltarParaDetalhes = () => {
    setModoReagendamento(false);
    window.location.reload();
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      navigate("/login/doador");
    } catch (error) {
      console.error("Erro no logout:", error);
      navigate("/login/doador");
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
          <p className="mt-3">Carregando...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (agendamentoExistente && !modoReagendamento) {
    return (
      <div>
        <NavigationDoador />

        <div className="container-fluid px-4 py-5">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="text-center mb-5">
                  <h1 className="display-5 fw-bold text-danger mb-3">
                    <i className="fas fa-calendar-check me-3"></i>
                    Agendamento Confirmado
                  </h1>
                  <p className="lead text-muted">
                    Seu agendamento está confirmado. Obrigado por salvar vidas!
                  </p>
                </div>

                <div className="card border-0 shadow-lg">
                  <div className="card-header bg-success text-white py-4">
                    <div className="text-center">
                      <i className="fas fa-check-circle fa-3x mb-3"></i>
                      <h3 className="mb-0">Agendamento Confirmado</h3>
                    </div>
                  </div>

                  <div className="card-body p-5">
                    <div className="row text-center">
                      <div className="col-md-6 mb-4">
                        <div className="info-card">
                          <i className="fas fa-calendar-day fa-2x text-danger mb-3"></i>
                          <h5>Data do Agendamento</h5>
                          <p className="fw-bold text-primary fs-4">
                            {formatarData(agendamentoExistente.data)}
                          </p>
                        </div>
                      </div>

                      <div className="col-md-6 mb-4">
                        <div className="info-card">
                          <i className="fas fa-map-marker-alt fa-2x text-danger mb-3"></i>
                          <h5>Local</h5>

                          <p className="fw-bold">
                            {agendamentoExistente.hemocentro_nome}
                          </p>

                          <small className="text-muted d-block mb-2">
                            {agendamentoExistente.hemocentro_endereco}
                          </small>

                          {agendamentoExistente.horario_funcionamento && (
                            <small className="text-secondary">
                              <i className="fas fa-clock me-1 text-danger"></i>
                              <strong>Horário de funcionamento:</strong>{" "}
                              {agendamentoExistente.horario_funcionamento}
                            </small>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="alert alert-info mt-4">
                      <h6>
                        <i className="fas fa-info-circle me-2"></i>
                        Informações Importantes
                      </h6>
                      <ul className="mb-0">
                        <li>Chegue com 15 minutos de antecedência</li>
                        <li>Traga documento oficial com foto</li>
                        <li>Esteja bem alimentado e hidratado</li>
                        <li>
                          Evite alimentos gordurosos nas 3 horas anteriores
                        </li>
                      </ul>
                    </div>

                    <div className="d-flex justify-content-center gap-3 mt-5">
                      <button
                        className="btn btn-outline-danger btn-lg"
                        onClick={handleCancelarAgendamento}
                      >
                        <i className="fas fa-times me-2"></i>
                        Cancelar Agendamento
                      </button>

                      <button
                        className="btn btn-primary btn-lg"
                        onClick={handleReagendarDoacao}
                        disabled={loadingReagendamento}
                      >
                        {loadingReagendamento ? (
                          <>
                            <div
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                            >
                              <span className="visually-hidden">
                                Carregando...
                              </span>
                            </div>
                            Processando...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-calendar-plus me-2"></i>
                            Reagendar Doação
                          </>
                        )}
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
  }

  return (
    <div>
      <NavigationDoador />
      <div className="container-fluid px-4 py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="text-center mb-5">
                <h1 className="display-5 fw-bold text-danger mb-3">
                  <i className="fas fa-calendar-plus me-3"></i>
                  {modoReagendamento
                    ? "Reagendar Doação de Sangue"
                    : "Agendar Doação de Sangue"}
                </h1>
                <p className="lead text-muted">
                  {modoReagendamento
                    ? "Escolha uma nova data para sua doação"
                    : "Preencha os dados para agendar sua próxima doação de sangue"}
                </p>
                {modoReagendamento && (
                  <div className="alert alert-warning d-inline-block">
                    <i className="fas fa-info-circle me-2"></i>
                    Você está reagendando sua doação. O agendamento anterior foi
                    cancelado.
                  </div>
                )}
              </div>

              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white py-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <h4 className="mb-0 text-danger">
                      <i className="fas fa-clipboard-list me-2"></i>
                      {modoReagendamento
                        ? "Novos Dados do Agendamento"
                        : "Dados do Agendamento"}
                    </h4>
                    {modoReagendamento && (
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={voltarParaDetalhes}
                      >
                        <i className="fas fa-arrow-left me-1"></i>Voltar
                      </button>
                    )}
                  </div>
                </div>
                <div className="card-body p-4">
                  {error && (
                    <div className="alert alert-warning" role="alert">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <h6 className="text-danger mb-3">
                        <i className="fas fa-map-marker-alt me-2"></i>Selecione
                        o Hemocentro
                      </h6>
                      <select
                        className="form-select form-select-lg"
                        name="hemocentro_id"
                        value={formData.hemocentro_id}
                        onChange={handleInputChange}
                        required
                        disabled={hemocentros.length === 0}
                      >
                        <option value="">
                          {hemocentros.length === 0
                            ? "Nenhum hemocentro disponível"
                            : "Selecione um hemocentro"}
                        </option>
                        {hemocentros.map((hemocentro) => (
                          <option key={hemocentro.id} value={hemocentro.id}>
                            {hemocentro.nome} - {hemocentro.cidade}/
                            {hemocentro.estado}
                          </option>
                        ))}
                      </select>
                      {hemocentros.length > 0 && (
                        <small className="text-muted">
                          {hemocentros.length} hemocentro(s) disponível(is)
                        </small>
                      )}
                    </div>

                    <div className="mb-4">
                      <h6 className="text-danger mb-3 text-center">
                        <i className="fas fa-calendar me-2"></i>
                        {modoReagendamento
                          ? "Nova Data da Doação"
                          : "Data da Doação"}
                      </h6>
                      <div className="row justify-content-center">
                        <div className="col-md-6">
                          <div className="text-center">
                            <label className="form-label fw-bold">
                              Selecione a Data *
                            </label>
                            <input
                              type="date"
                              className="form-control form-control-lg text-center"
                              name="data"
                              value={formData.data}
                              onChange={handleInputChange}
                              min={new Date().toISOString().split("T")[0]}
                              required
                              disabled={hemocentros.length === 0}
                            />
                            <small className="text-muted">
                              O horário será definido automaticamente pelo
                              hemocentro
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h6 className="text-danger mb-3 text-center">
                        <i className="fas fa-droplet me-2"></i>Tipo de Doação
                      </h6>
                      <div className="row justify-content-center">
                        <div className="col-md-6">
                          <div className="card border-success">
                            <div className="card-body text-center py-4">
                              <input
                                type="radio"
                                className="btn-check"
                                name="tipo_doacao"
                                id="sangueTotal"
                                value="sangue_total"
                                checked={
                                  formData.tipo_doacao === "sangue_total"
                                }
                                onChange={handleInputChange}
                                disabled={hemocentros.length === 0}
                              />
                              <label
                                className="btn btn-outline-success w-100 py-3"
                                htmlFor="sangueTotal"
                              >
                                <i className="fas fa-heart-pulse fa-2x d-block mb-2"></i>
                                <strong className="fs-5">
                                  Doação de Sangue
                                </strong>
                                <small className="d-block mt-2">
                                  450ml | Aproximadamente 60 minutos
                                </small>
                                <small className="d-block text-muted">
                                  Doação de sangue
                                </small>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="form-check mb-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="termos"
                          required
                          disabled={hemocentros.length === 0}
                        />
                        <label className="form-check-label" htmlFor="termos">
                          Declaro que li e concordo com os termos e condições
                          para doação de sangue
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="saude"
                          required
                          disabled={hemocentros.length === 0}
                        />
                        <label className="form-check-label" htmlFor="saude">
                          Declaro que estou em boas condições de saúde e atendo
                          aos requisitos para doação
                        </label>
                      </div>
                    </div>

                    <div className="d-grid">
                      <button
                        type="submit"
                        className="btn btn-danger btn-lg py-3"
                        disabled={hemocentros.length === 0}
                      >
                        <i className="fas fa-calendar-check me-2"></i>
                        {hemocentros.length === 0
                          ? "Nenhum Hemocentro Disponível"
                          : modoReagendamento
                          ? "Confirmar Reagendamento"
                          : "Confirmar Agendamento"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="card border-0 shadow-sm mt-4">
                <div className="card-body">
                  <h5 className="text-danger mb-3">
                    <i className="fas fa-info-circle me-2"></i>Informações
                    Importantes
                  </h5>
                  <div className="row">
                    <div className="col-md-6">
                      <ul className="list-unstyled">
                        <li>
                          <i className="fas fa-check text-success me-2"></i>
                          Documento com foto obrigatório
                        </li>
                        <li>
                          <i className="fas fa-check text-success me-2"></i>
                          Estar bem alimentado e hidratado
                        </li>
                        <li>
                          <i className="fas fa-check text-success me-2"></i>Ter
                          entre 16 e 69 anos
                        </li>
                      </ul>
                    </div>
                    <div className="col-md-6">
                      <ul className="list-unstyled">
                        <li>
                          <i className="fas fa-check text-success me-2"></i>
                          Pesar mais de 50kg
                        </li>
                        <li>
                          <i className="fas fa-check text-success me-2"></i>Ter
                          dormido pelo menos 6 horas
                        </li>
                        <li>
                          <i className="fas fa-check text-success me-2"></i>Não
                          estar em jejum
                        </li>
                      </ul>
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

export default Agendamento;
