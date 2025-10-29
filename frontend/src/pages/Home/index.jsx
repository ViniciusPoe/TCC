import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Footer from "../../components/Footer";
import "./styles.css";

const HomeCentral = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="home-central">
      {/* Navegação Integrada */}
      <nav
        className={`navbar navbar-expand-lg navigation-integrada ${
          isScrolled ? "scrolled" : ""
        }`}
      >
        <div className="container">
          <Link className="navbar-brand" to="/">
            <i className="fas fa-hand-holding-heart me-2"></i>
            BloodSystem
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarIntegrated"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarIntegrated">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <button
                  className="nav-link"
                  onClick={() => scrollToSection("inicio")}
                >
                  Início
                </button>
              </li>
              <li className="nav-item">
                <button
                  className="nav-link"
                  onClick={() => scrollToSection("doadores")}
                >
                  Para Doadores
                </button>
              </li>
              <li className="nav-item">
                <button
                  className="nav-link"
                  onClick={() => scrollToSection("hemocentros")}
                >
                  Para Hemocentros
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section Simples */}
      <section id="inicio" className="hero-simple">
        <div className="container">
          <div className="row align-items-center hero-content">
            <div className="col-lg-8 mx-auto text-center">
              <h1 className="hero-title">BloodSystem</h1>
              <p className="hero-subtitle">
                Conectando doadores e hemocentros para salvar vidas
              </p>
              <p className="hero-description">
                Uma plataforma completa que simplifica o processo de doação de
                sangue, tornando mais fácil para doadores ajudarem e hemocentros
                gerenciarem suas operações.
              </p>
              <div className="hero-actions">
                <Link
                  to="/cadastro/doador"
                  className="btn btn-primary btn-lg me-3"
                >
                  Começar a Doar
                </Link>
                <button
                  className="btn btn-outline-light btn-lg"
                  onClick={() => scrollToSection("doadores")}
                >
                  Saiba Mais
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Para Doadores */}
      <section id="doadores" className="section-doadores py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h2 className="section-title">Para Doadores</h2>
              <p className="section-description">
                Faça a diferença de forma simples e organizada
              </p>
              <div className="features-list">
                <div className="feature-item">
                  <i className="fas fa-calendar-check"></i>
                  <div>
                    <h4>Agendamento Simplificado</h4>
                    <p>Agende sua doação de forma rápida e conveniente</p>
                  </div>
                </div>
                <div className="feature-item">
                  <i className="fas fa-history"></i>
                  <div>
                    <h4>Histórico Completo</h4>
                    <p>Acompanhe todas as suas doações e datas importantes</p>
                  </div>
                </div>
                <div className="feature-item">
                  <i className="fas fa-bullhorn"></i>
                  <div>
                    <h4>Participe de Campanhas</h4>
                    <p>
                      Encontre e participe de campanhas de doação na sua região
                    </p>
                  </div>
                </div>
                <div className="feature-item">
                  <i className="fas fa-bell"></i>
                  <div>
                    <h4>Disponibilidade</h4>
                    <p>
                      Saiba quando você está apto para fazer sua próxima doação
                    </p>
                  </div>
                </div>
              </div>
              <div className="section-actions">
                <Link to="/cadastro/doador" className="btn btn-primary me-3">
                  Cadastrar como Doador
                </Link>
                <Link to="/login/doador" className="btn btn-outline-primary">
                  Já tenho conta
                </Link>
              </div>
            </div>
            <div className="col-lg-6 text-center">
              <div className="feature-image">
                <i className="fas fa-hand-holding-heart"></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Para Hemocentros */}
      <section id="hemocentros" className="section-hemocentros py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 text-center order-lg-1">
              <div className="feature-image">
                <i className="fas fa-hospital"></i>
              </div>
            </div>
            <div className="col-lg-6 order-lg-2">
              <h2 className="section-title">Para Hemocentros</h2>
              <p className="section-description">
                Gerencie suas operações de forma eficiente
              </p>
              <div className="features-list">
                <div className="feature-item">
                  <i className="fas fa-users"></i>
                  <div>
                    <h4>Visualizar Doadores</h4>
                    <p>
                      Acesse a base de doadores cadastrados e suas informações
                    </p>
                  </div>
                </div>
                <div className="feature-item">
                  <i className="fas fa-calendar-plus"></i>
                  <div>
                    <h4>Agendar Doações</h4>
                    <p>Gerencie agendamentos e horários disponíveis</p>
                  </div>
                </div>
                <div className="feature-item">
                  <i className="fas fa-chart-line"></i>
                  <div>
                    <h4>Controle de Campanhas</h4>
                    <p>Crie e gerencie campanhas de doação</p>
                  </div>
                </div>
                <div className="feature-item">
                  <i className="fas fa-comments"></i>
                  <div>
                    <h4>Contato com Doadores</h4>
                    <p>Facilite a comunicação com sua rede de doadores</p>
                  </div>
                </div>
              </div>
              <div className="section-actions">
                <Link
                  to="/cadastro/hemocentro"
                  className="btn btn-primary me-3"
                >
                  Cadastrar Hemocentro
                </Link>
                <Link
                  to="/login/hemocentro"
                  className="btn btn-outline-primary"
                >
                  Acessar Sistema
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="cta-simple py-5">
        <div className="container text-center">
          <h2 className="cta-title">Pronto para fazer a diferença?</h2>
          <p className="cta-description">
            Junte-se à nossa comunidade e ajude a salvar vidas
          </p>
          <div className="cta-buttons">
            <Link to="/cadastro/doador" className="btn btn-primary btn-lg me-3">
              Quero Doar
            </Link>
            <Link
              to="/cadastro/hemocentro"
              className="btn btn-outline-light btn-lg"
            >
              Sou Hemocentro
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomeCentral;
