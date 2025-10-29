import React from "react";
import { useLocation } from "react-router-dom";
import "./styles.css";

const Footer = () => {
  const location = useLocation();

  const isHemocentro = location.pathname.includes("/hemocentro");
  const isDoador = location.pathname.includes("/doador");
  const isCentral = !isDoador && !isHemocentro;

  return (
    <footer
      className={`footer ${
        isHemocentro
          ? "footer-hemocentro"
          : isDoador
          ? "footer-doador"
          : "footer-central"
      }`}
    >
      <p>
        &copy; {new Date().getFullYear()} BloodSystem — Todos os direitos reservados.
      </p>
    </footer>
  );
};

export default Footer;
