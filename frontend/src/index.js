import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// ✅ Bootstrap principal (importar apenas uma vez!)
import "bootstrap/dist/css/bootstrap.min.css";

// ✅ FontAwesome (ícones)
import "@fortawesome/fontawesome-free/css/all.min.css";

// ✅ Seus estilos personalizados
import "./index.css";

// 🚀 Inicializa a aplicação
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
