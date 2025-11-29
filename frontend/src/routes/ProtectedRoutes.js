import React from "react";
import { Navigate } from "react-router-dom";
import { authManager } from "../utils/authManager";

export const ProtectedDoadorRoute = ({ children }) => {
  const valid = authManager.isValid();
  const tipo = authManager.getUserType();
  const user = authManager.getUserData();

  console.log("🔎 [Rota Doador] Verificando sessão...", {
    valid,
    tipo,
    nome: user?.nome,
  });

  if (!valid || tipo !== "doador") {
    console.warn("🚫 Acesso negado: rota doador.");
    return <Navigate to="/login/doador" replace />;
  }

  console.log(`✅ Acesso autorizado: doador ${user?.nome}`);
  return children;
};

export const ProtectedHemocentroRoute = ({ children }) => {
  if (!authManager.getUserData()) {
    const hemocentro = localStorage.getItem("hemosys_auth_hemocentro");
    const doador = localStorage.getItem("hemosys_auth_doador");

    if (hemocentro && doador) {
      const hData = JSON.parse(hemocentro);
      const dData = JSON.parse(doador);
      const maisRecente =
        hData.timestamp > dData.timestamp ? "hemocentro" : "doador";
      authManager.restore(maisRecente);
    } else if (hemocentro) {
      authManager.restore("hemocentro");
    } else if (doador) {
      authManager.restore("doador");
    }
  }

  const valid = authManager.isValid();
  const tipo = authManager.getUserType();
  const user = authManager.getUserData();

  console.log("🔎 [Rota Hemocentro] Verificando sessão...", {
    valid,
    tipo,
    nome: user?.nome,
  });

  if (!valid || tipo !== "hemocentro") {
    console.warn("🚫 Acesso negado: rota hemocentro.");
    return <Navigate to="/login/hemocentro" replace />;
  }

  console.log(`✅ Acesso autorizado: hemocentro ${user?.nome}`);
  return children;
};
