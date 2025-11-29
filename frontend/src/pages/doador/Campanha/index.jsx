import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavigationDoador from "../../../components/Navigation/NavigationDoador";
import Footer from "../../../components/Footer";
import { api } from "../../../services/api";
import "./styles.css";

const CampanhasDoador = () => {
  const [campanhas, setCampanhas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCampanhas = async () => {
      try {
        console.log("🔄 Buscando campanhas para doador...");

        const response = await api.getCampanhasDoador();

        if (response.success) {
          const lista =
            response.campanhas ||
            response.data?.campanhas ||
            response.data ||
            [];

          console.log("✅ Campanhas recebidas:", lista);
          setCampanhas(lista);
        } else {
          console.error("❌ Erro ao buscar campanhas:", response.message);
        }
      } catch (error) {
        console.error("💥 Erro ao carregar campanhas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampanhas();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "ativa":
        return "badge bg-success";
      case "urgente":
        return "badge bg-danger";
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
      case "urgente":
        return "Urgente";
      case "concluida":
        return "Concluída";
      default:
        return status;
    }
  };

  const formatarData = (data) => {
    if (!data) return "—";

    const date = new Date(data);
    if (isNaN(date)) {
      console.warn("⚠️ Data inválida em CampanhasDoador:", data);
      return "—";
    }

    return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  };

  if (loading) {
    return (
      <div>
        <NavigationDoador />
        <div className="text-center mt-5 py-5">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="mt-3">Carregando campanhas...</p>
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

          <div className="row mb-5">
            <div className="col-12 text-center">
              <h1 className="display-5 fw-bold text-danger mb-3">
                <i className="fas fa-bullhorn me-3"></i>Campanhas
              </h1>
              <p className="lead text-muted">
                Participe das nossas campanhas e ajude a salvar vidas
              </p>
            </div>
          </div>

          <div className="row">
            {campanhas.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-bullhorn fa-4x text-muted mb-3"></i>
                <h5 className="text-muted">
                  Nenhuma campanha ativa no momento
                </h5>
                <p className="text-muted">
                  Em breve teremos novas campanhas para você participar.
                </p>
              </div>
            ) : (
              campanhas.map((campanha) => (
                <div key={campanha.id} className="col-lg-6 mb-4">
                  <div className="card campanha-card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <span className={getStatusBadge(campanha.status)}>
                          {getStatusText(campanha.status)}
                        </span>
                        <small className="text-muted">
                          Até {formatarData(campanha.data_fim)}
                        </small>
                      </div>

                      <h5 className="card-title text-danger">
                        {campanha.titulo}
                      </h5>
                      <p className="card-text">{campanha.descricao}</p>

                      <div className="mb-3">
                        <small className="text-muted">
                          <i className="fas fa-map-marker-alt me-1"></i>
                          {campanha.local}
                        </small>
                      </div>

                      <div className="mb-3">
                        <small className="text-muted">
                          <i className="fas fa-calendar me-1"></i>
                          Período: {formatarData(campanha.data_inicio)} a{" "}
                          {formatarData(campanha.data_fim)}
                        </small>
                      </div>

                      <div className="d-flex mt-auto">
                        <button
                          className="btn btn-danger btn-sm w-100"
                          onClick={() => navigate("/doador/agendamento")}
                        >
                          <i className="fas fa-calendar-plus me-1"></i>
                          Agendar Doação
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CampanhasDoador;
