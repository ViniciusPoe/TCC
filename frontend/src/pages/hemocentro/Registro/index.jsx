import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavigationInstituicao from "../../../components/Navigation/NavigationHemocentro";
import Footer from "../../../components/Footer";
import { api } from "../../../services/api";
import "./styles.css";

const RegistroDoacoes = () => {
  const [doacoes, setDoacoes] = useState([]);
  const [doadoresComAgendamento, setDoadoresComAgendamento] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filtroData, setFiltroData] = useState("");

  const [formData, setFormData] = useState({
    doador_id: "",
    tipo_sanguineo: "",
    volume: 450,
    tipo_doacao: "sangue_total",
    data_doacao: new Date().toISOString().split("T")[0],
    horario: new Date().toTimeString().slice(0, 5),
    observacoes: "",
    hemoglobina: "",
    pressao_arterial: "",
    peso: "",
    temperatura: "",
  });

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

        console.log("🩸 Buscando doações do hemocentro logado...");
        const doacoesResponse = await api.getDoacoes();
        console.log("📊 Doações response:", doacoesResponse);

        if (doacoesResponse.success) {
          setDoacoes(doacoesResponse.data?.doacoes || []);
        } else {
          setDoacoes([]);
        }

        console.log("👥 Buscando doadores com agendamento...");
        const doadoresResponse = await api.getDoadoresComAgendamento();
        console.log("👥 Doadores com agendamento response:", doadoresResponse);

        if (doadoresResponse.success) {
          setDoadoresComAgendamento(doadoresResponse.doadores || []);
        } else {
          setDoadoresComAgendamento([]);
        }
      } catch (error) {
        console.error("❌ Erro ao carregar dados:", error);

        if (
          error.message?.includes("token") ||
          error.message?.includes("autenticação")
        ) {
          navigate("/login/hemocentro");
          return;
        }

        setDoacoes([]);
        setDoadoresComAgendamento([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "doador_id" && value) {
      const doadorSelecionado = doadoresComAgendamento.find(
        (d) => d.id === parseInt(value)
      );
      if (doadorSelecionado) {
        setFormData((prev) => ({
          ...prev,
          tipo_sanguineo: doadorSelecionado.tipo_sanguineo,
          tipo_doacao: doadorSelecionado.tipo_doacao_agendada || "sangue_total",
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      console.log("📤 Enviando dados da doação:", formData);

      if (!api.isAuthenticated()) {
        alert("Sessão expirada. Faça login novamente.");
        navigate("/login/hemocentro");
        return;
      }

      const response = await api.registrarDoacao(formData);

      if (response.success) {
        console.log("✅ Doação registrada com sucesso!");

        const [doacoesResponse, doadoresResponse] = await Promise.all([
          api.getDoacoes(),
          api.getDoadoresComAgendamento(),
        ]);

        if (doacoesResponse.success) {
          setDoacoes(
            doacoesResponse.data?.doacoes ||
              doacoesResponse.doacoes ||
              []
          );
        }

        if (doadoresResponse.success) {
          setDoadoresComAgendamento(
            doadoresResponse.data?.doadores ||
              doadoresResponse.doadores ||
              doadoresResponse.data ||
              []
          );
        }

        setFormData({
          doador_id: "",
          tipo_sanguineo: "",
          volume: 450,
          tipo_doacao: "sangue_total",
          data_doacao: new Date().toISOString().split("T")[0],
          horario: new Date().toTimeString().slice(0, 5),
          observacoes: "",
          hemoglobina: "",
          pressao_arterial: "",
          peso: "",
          temperatura: "",
        });

        setShowForm(false);

        alert(
          "Doação registrada com sucesso! O histórico do doador foi atualizado."
        );
      } else {
        alert("Erro ao registrar doação: " + response.message);
      }
    } catch (error) {
      console.error("Erro ao registrar doação:", error);
      alert("Erro ao conectar com o servidor");
    }
  };

  const doacoesFiltradas = filtroData
    ? doacoes.filter(
        (doacao) =>
          doacao.data_doacao === filtroData.split("-").reverse().join("/")
      )
    : doacoes;

  const handleLogout = async () => {
    try {
      await api.logout();
      navigate("/login/hemocentro");
    } catch (error) {
      console.error("Erro no logout:", error);
      navigate("/login/hemocentro");
    }
  };

  if (loading) {
    return (
      <div>
        <NavigationInstituicao />
        <div className="text-center mt-5 py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="mt-3">Carregando doações...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="registro-doacoes">
      <NavigationInstituicao />

      <div className="container-fluid px-4 py-5">
        <div className="container">
          <div className="row mb-5">
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                  <h1 className="display-5 fw-bold text-primary mb-2">
                    <i className="fas fa-tint me-3"></i>Registro de Doações
                  </h1>
                  <p className="lead text-muted">
                    Registre as doações realizadas no hemocentro
                  </p>
                </div>

                <div className="d-flex gap-2 flex-wrap">
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => setShowForm(true)}
                    disabled={doadoresComAgendamento.length === 0}
                  >
                    <i className="fas fa-plus me-2"></i>Nova Doação
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-md-8">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-md-6">
                      <label className="form-label">Filtrar por data:</label>
                      <input
                        type="date"
                        className="form-control"
                        value={filtroData}
                        onChange={(e) => setFiltroData(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <button
                        className="btn btn-outline-secondary mt-4"
                        onClick={() => setFiltroData("")}
                      >
                        <i className="fas fa-times me-1"></i>Limpar Filtro
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <h3 className="text-primary">{doacoes.length}</h3>
                  <p className="text-muted mb-0">Doações Registradas</p>
                  <small className="text-muted">
                    {doadoresComAgendamento.length} doadores agendados
                  </small>
                </div>
              </div>
            </div>
          </div>

          {showForm && (
            <div className="row mb-5">
              <div className="col-12">
                <div className="card border-0 shadow-lg">
                  <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <i className="fas fa-plus-circle me-2"></i>
                      Registrar Nova Doação
                    </h5>
                    <button
                      type="button"
                      className="btn btn-outline-light btn-sm"
                      onClick={() => setShowForm(false)}
                    >
                      <i className="fas fa-times me-1"></i>Fechar
                    </button>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleSubmit}>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Doador *</label>
                          <select
                            className="form-select"
                            name="doador_id"
                            value={formData.doador_id}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="">
                              Selecione um doador com agendamento
                            </option>
                            {doadoresComAgendamento.map((doador) => (
                              <option key={doador.id} value={doador.id}>
                                {doador.nome} - {doador.tipo_sanguineo} -
                                Agendado: {doador.data_agendamento}
                              </option>
                            ))}
                          </select>
                          <small className="text-muted">
                            Apenas doadores com agendamentos ativos
                          </small>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Tipo Sanguíneo *</label>
                          <input
                            type="text"
                            className="form-control"
                            name="tipo_sanguineo"
                            value={formData.tipo_sanguineo}
                            readOnly
                            style={{ backgroundColor: "#f8f9fa" }}
                          />
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Volume (ml) *</label>
                          <select
                            className="form-select"
                            name="volume"
                            value={formData.volume}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="450">450ml</option>
                          </select>
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Tipo de Doação *</label>
                          <select
                            className="form-select"
                            name="tipo_doacao"
                            value={formData.tipo_doacao}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="sangue_total">Sangue Total</option>
                          </select>
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Peso (kg)</label>
                          <input
                            type="number"
                            className="form-control"
                            name="peso"
                            value={formData.peso}
                            onChange={handleInputChange}
                            placeholder="Ex: 70"
                          />
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Data da Doação *</label>
                          <input
                            type="date"
                            className="form-control"
                            name="data_doacao"
                            value={formData.data_doacao}
                            onChange={handleInputChange}
                            required
                            min={
                              new Date(
                                Date.now() -
                                  new Date().getTimezoneOffset() * 60000
                              )
                                .toISOString()
                                .split("T")[0]
                            }
                          />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Horário *</label>
                          <input
                            type="time"
                            className="form-control"
                            name="horario"
                            value={formData.horario}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Temperatura (°C)</label>
                          <input
                            type="number"
                            step="0.1"
                            className="form-control"
                            name="temperatura"
                            value={formData.temperatura}
                            onChange={handleInputChange}
                            placeholder="Ex: 36.5"
                          />
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <label className="form-label">
                            Hemoglobina (g/dL) *
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            className="form-control"
                            name="hemoglobina"
                            value={formData.hemoglobina}
                            onChange={handleInputChange}
                            required
                            placeholder="Ex: 14.2"
                          />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label">
                            Pressão Arterial *
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="pressao_arterial"
                            value={formData.pressao_arterial}
                            onChange={handleInputChange}
                            required
                            placeholder="Ex: 120/80"
                          />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Status</label>
                          <input
                            type="text"
                            className="form-control bg-success text-white"
                            value="APROVADA"
                            readOnly
                            style={{ fontWeight: "bold" }}
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Observações</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          name="observacoes"
                          value={formData.observacoes}
                          onChange={handleInputChange}
                          placeholder="Observações sobre a doação..."
                        />
                      </div>

                      <div className="d-flex gap-2 flex-wrap">
                        <button type="submit" className="btn btn-primary">
                          <i className="fas fa-save me-1"></i>Registrar Doação
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowForm(false)}
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

          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <i className="fas fa-list me-2"></i>
                      Doações Registradas ({doacoesFiltradas.length})
                    </h5>
                    <span className="badge bg-success">Todas Aprovadas</span>
                  </div>
                </div>
                <div className="card-body p-0">
                  {doacoesFiltradas.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="fas fa-tint fa-4x text-muted mb-3"></i>
                      <h5 className="text-muted">
                        {filtroData
                          ? "Nenhuma doação encontrada para esta data"
                          : "Nenhuma doação registrada"}
                      </h5>
                      {!filtroData && doadoresComAgendamento.length > 0 && (
                        <button
                          className="btn btn-primary mt-3"
                          onClick={() => setShowForm(true)}
                        >
                          <i className="fas fa-plus me-1"></i>Registrar Primeira
                          Doação
                        </button>
                      )}
                      {!filtroData && doadoresComAgendamento.length === 0 && (
                        <p className="text-warning mt-3">
                          Não há doadores com agendamentos ativos para registrar
                          doações.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Doador</th>
                            <th>Tipo Sanguíneo</th>
                            <th>Volume</th>
                            <th>Data/Hora</th>
                            <th>Hemoglobina</th>
                            <th>Pressão</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {doacoesFiltradas.map((doacao) => (
                            <tr key={doacao.id}>
                              <td>
                                <strong>{doacao.doador_nome}</strong>
                              </td>
                              <td>
                                <span className="badge bg-primary">
                                  {doacao.tipo_sanguineo}
                                </span>
                              </td>
                              <td>
                                <strong>{doacao.volume}ml</strong>
                              </td>
                              <td>
                                <div>
                                  <strong>{doacao.data_doacao}</strong>
                                  <br />
                                  <small className="text-muted">
                                    {doacao.horario}
                                  </small>
                                </div>
                              </td>
                              <td>
                                <span
                                  className={`fw-bold ${
                                    parseFloat(doacao.hemoglobina) >= 13
                                      ? "text-success"
                                      : "text-danger"
                                  }`}
                                >
                                  {doacao.hemoglobina}g/dL
                                </span>
                              </td>
                              <td>
                                <small>{doacao.pressao_arterial}</small>
                              </td>
                              <td>
                                <span className="badge bg-success">
                                  Aprovada
                                </span>
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

      <Footer />
    </div>
  );
};

export default RegistroDoacoes;
