import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { authManager } from "./utils/authManager";

import Home from "./pages/Home";
import LoginDoador from "./pages/auth/LoginDoador";
import LoginHemocentro from "./pages/auth/LoginHemocentro";
import CadastroDoador from "./pages/auth/CadastroDoador";
import CadastroHemocentro from "./pages/auth/CadastroHemocentro";

import InicioDoador from "./pages/doador/Inicio";
import CarteiraDoador from "./pages/doador/Carteira";
import CampanhasDoador from "./pages/doador/Campanha";
import Historico from "./pages/doador/Historico";
import AgendamentoDoador from "./pages/doador/Agendamento";

import InicioHemocentro from "./pages/hemocentro/Inicio";
import Campanhas from "./pages/hemocentro/Campanha";
import Doadores from "./pages/hemocentro/Doadores";
import AgendamentoHemocentro from "./pages/hemocentro/Agendamentos";
import Registro from "./pages/hemocentro/Registro";
import PerfilHemocentro from "./pages/hemocentro/Perfil";

import { ProtectedDoadorRoute, ProtectedHemocentroRoute } from "./routes/ProtectedRoutes";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login/doador" element={<LoginDoador />} />
          <Route path="/login/hemocentro" element={<LoginHemocentro />} />
          <Route path="/cadastro/doador" element={<CadastroDoador />} />
          <Route path="/cadastro/hemocentro" element={<CadastroHemocentro />} />

          <Route
            path="/doador/inicio"
            element={
              <ProtectedDoadorRoute>
                <InicioDoador />
              </ProtectedDoadorRoute>
            }
          />
          <Route
            path="/doador/carteira"
            element={
              <ProtectedDoadorRoute>
                <CarteiraDoador />
              </ProtectedDoadorRoute>
            }
          />
          <Route
            path="/doador/campanhas"
            element={
              <ProtectedDoadorRoute>
                <CampanhasDoador />
              </ProtectedDoadorRoute>
            }
          />
          <Route
            path="/doador/historico"
            element={
              <ProtectedDoadorRoute>
                <Historico />
              </ProtectedDoadorRoute>
            }
          />
          <Route
            path="/doador/agendamento"
            element={
              <ProtectedDoadorRoute>
                <AgendamentoDoador />
              </ProtectedDoadorRoute>
            }
          />

          <Route
            path="/hemocentro/inicio"
            element={
              <ProtectedHemocentroRoute>
                <InicioHemocentro />
              </ProtectedHemocentroRoute>
            }
          />
          <Route
            path="/hemocentro/campanhas"
            element={
              <ProtectedHemocentroRoute>
                <Campanhas />
              </ProtectedHemocentroRoute>
            }
          />
          <Route
            path="/hemocentro/doadores"
            element={
              <ProtectedHemocentroRoute>
                <Doadores />
              </ProtectedHemocentroRoute>
            }
          />
          <Route
            path="/hemocentro/registros"
            element={
              <ProtectedHemocentroRoute>
                <Registro />
              </ProtectedHemocentroRoute>
            }
          />
          <Route
            path="/hemocentro/agendamentos"
            element={
              <ProtectedHemocentroRoute>
                <AgendamentoHemocentro />
              </ProtectedHemocentroRoute>
            }
            />
          <Route
            path="/hemocentro/perfil"
            element={
              <ProtectedHemocentroRoute>
                <PerfilHemocentro />
              </ProtectedHemocentroRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
