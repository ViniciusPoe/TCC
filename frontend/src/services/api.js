// =======================================
// ✅ API SERVICE - VERSÃO SINCRONIZADA
// =======================================

import { authManager } from "../utils/authManager";

const API_BASE_URL = "https://tcc-34y4.onrender.com";

// =======================================
// 🔧 HEADERS DE AUTENTICAÇÃO
// =======================================
export function getAuthHeaders() {
  const token = authManager.getToken();
  if (!token) throw new Error("Token ausente");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// =======================================
// ⚙️ HANDLER GLOBAL DE RESPOSTAS
// =======================================
const handleResponse = async (response) => {
  if (response.status === 401) {
    // Descobre tipo de usuário pra redirecionar corretamente
    const tipo = authManager.getUserData()?.tipo || "hemocentro";
    authManager.clear();

    const destino = tipo === "doador" ? "/login/doador" : "/login/hemocentro";

    console.warn("⚠️ Sessão expirada, redirecionando para:", destino);
    window.location.href = destino;
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = { message: "Erro desconhecido" };
  }

  if (!response.ok) {
    console.error(`❌ Erro HTTP ${response.status}:`, data.message);
    throw new Error(data.message || `Erro HTTP ${response.status}`);
  }

  return data;
};

// =======================================
// 💾 FUNÇÕES PRINCIPAIS
// =======================================
export const api = {
  // ========= AUTENTICAÇÃO =========

  async loginDoador(dados) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login/doador`, {
        // ✅ direto
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });

      const data = await response.json();
      console.log("✅ Login doador bem-sucedido:", data);

      if (!response.ok) {
        throw new Error(data.message || "Erro no login");
      }

      return data;
    } catch (error) {
      console.error("❌ Erro no login doador:", error);
      return { success: false, message: error.message };
    }
  },

  async loginHemocentro({ cnpj, senha }) {
    try {
      const body = JSON.stringify({ cnpj, senha });
      const response = await fetch(`${API_BASE_URL}/api/login/hemocentro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      const data = await handleResponse(response);

      if (data.success && data.token && data.user) {
        const user = {
          id: data.user.id ?? null,
          nome: data.user.nome ?? null,
          cnpj: data.user.cnpj ?? null,
          email: data.user.email ?? null,
          cidade: data.user.cidade ?? null,
          estado: data.user.estado ?? null,
          tipo: "hemocentro",
        };

        console.log("✅ Login hemocentro:", user);

        authManager.clear();
        authManager.setAuth(data.token, user);
        authManager.restore("hemocentro");
      } else {
        console.warn("⚠️ Login hemocentro: resposta inesperada", data);
      }

      return data;
    } catch (err) {
      console.error("💥 Erro no loginHemocentro:", err);
      throw err;
    }
  },

  async checkAuth() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/check-auth`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const data = await handleResponse(response);
      if (data.success && data.user)
        console.log("✅ Sessão válida para:", data.user.nome);
      return data;
    } catch (error) {
      console.error("❌ Erro checkAuth:", error);
      return { success: false, message: error.message };
    }
  },

  async getHemocentroInfo() {
    const token = authManager.getTokenByType("hemocentro");
    if (!token) throw new Error("Token ausente (hemocentro não autenticado)");

    const response = await fetch(`${API_BASE_URL}/hemocentro/api/perfil`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },

  async atualizarPerfilHemocentro(dados) {
    const token = authManager.getTokenByType("hemocentro");
    if (!token) throw new Error("Token ausente (hemocentro não autenticado)");

    const response = await fetch(`${API_BASE_URL}/hemocentro/api/perfil`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dados),
    });

    const result = await response.json();
    return result;
  },

  logout() {
    authManager.clear();
    return Promise.resolve({ success: true });
  },

  // ========= CADASTROS =========
  async cadastroDoador(dados) {
    const payload = {
      nome: dados.nome,
      data_nascimento: dados.data_nascimento,
      cpf: dados.cpf,
      rg: dados.rg,
      sexo: dados.sexo,
      tipo_sanguineo: dados.tipo_sanguineo,
      email: dados.email,
      telefone: dados.telefone,
      cep: dados.cep,
      logradouro: dados.logradouro,
      numero: dados.numero,
      complemento: dados.complemento,
      bairro: dados.bairro,
      cidade: dados.cidade,
      estado: dados.estado,
      peso: dados.peso,
      altura: dados.altura,
      senha: dados.senha,

      // ✅ CORREÇÃO: Use os mesmos nomes que o backend espera
      ultima_doacao_tipo: dados.ultima_doacao_tipo, // 'nunca' ou 'doador'
      ultima_doacao:
        dados.ultima_doacao_tipo === "doador" ? dados.ultima_doacao : null,
      proxima_doacao:
        dados.ultima_doacao_tipo === "doador" ? dados.proxima_doacao : null,
    };

    // 🔍 Debug para confirmar no console antes do envio
    console.log("📤 Payload final enviado ao backend:", payload);

    const response = await fetch(`${API_BASE_URL}/api/cadastro/doador`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    return handleResponse(response);
  },

  async cadastroHemocentro(dados) {
    const response = await fetch(`${API_BASE_URL}/api/cadastro/hemocentro`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(dados),
    });
    return handleResponse(response);
  },

  // ========= DOADOR =========
  async getPerfilDoador() {
    const token = authManager.getToken();
    const response = await fetch(`${API_BASE_URL}/doador/api/perfil`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  async atualizarPerfilDoador(dados) {
    const token = authManager.getToken();
    const response = await fetch(`${API_BASE_URL}/doador/api/perfil`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dados),
    });
    return handleResponse(response);
  },

  async getHistorico() {
    const response = await fetch(`${API_BASE_URL}/doador/api/historico`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getCarteiraDoador() {
    const response = await fetch(`${API_BASE_URL}/doador/api/carteira`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // ========= AGENDAMENTOS DOADOR =========
  async fazerAgendamento(dados) {
    const response = await fetch(`${API_BASE_URL}/doador/api/agendamento`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(dados),
    });
    return handleResponse(response);
  },

  async getAgendamentosDoador() {
    const response = await fetch(
      `${API_BASE_URL}/doador/api/agendamentos/doador`,
      { headers: getAuthHeaders() }
    );
    return handleResponse(response);
  },

  async cancelarAgendamento(id) {
    const response = await fetch(
      `${API_BASE_URL}/doador/api/agendamento/${id}/cancelar`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
      }
    );
    return handleResponse(response);
  },

  // ========= HEMOCENTROS =========
  getHemocentros: async () => {
    const response = await fetch(`${API_BASE_URL}/doador/api/hemocentros`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  // ========= HEMOCENTRO (INSTITUIÇÃO) =========
  async getAgendamentosHemocentro() {
    const token = authManager.getToken();
    if (!token) throw new Error("Token ausente");

    const response = await fetch(
      `${API_BASE_URL}/hemocentro/api/agendamentos/hemocentro`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    return {
      success: data.success,
      agendamentos: data.data?.agendamentos || [],
    };
  },

  // ======================================================
  // ♻️ REAGENDAR AGENDAMENTO (HEMOCENTRO)
  // ======================================================
  async reagendarAgendamento(id, dados) {
    const token = authManager.getToken();
    if (!token) throw new Error("Token ausente");

    const response = await fetch(
      `${API_BASE_URL}/hemocentro/api/agendamento/${id}/reagendar`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dados),
      }
    );

    const data = await response.json();
    return {
      success: data.success,
      message: data.message,
      agendamento: data.data || null,
    };
  },

  // ========= DOADORES =========
  async getDoadores() {
    const response = await fetch(`${API_BASE_URL}/hemocentro/api/doadores`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getDoadoresComAgendamento() {
    const token = authManager.getToken();
    if (!token) throw new Error("Token ausente");

    const response = await fetch(
      `${API_BASE_URL}/hemocentro/api/doadores-com-agendamento`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    return {
      success: data.success,
      message: data.message,
      doadores: data.data?.doadores || [],
    };
  },
  // ========= DOAÇÕES =========
  async getDoacoes() {
    const token = authManager.getToken(); // ✅ pega o JWT salvo no login
    if (!token) throw new Error("Token ausente");

    const response = await fetch(`${API_BASE_URL}/hemocentro/api/doacoes`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ✅ envia token no header
      },
    });

    return handleResponse(response);
  },

  async registrarDoacao(dados) {
    const token = authManager.getToken(); // ✅ pega o JWT
    if (!token) throw new Error("Token ausente");

    const response = await fetch(
      `${API_BASE_URL}/hemocentro/api/registrar-doacao`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ✅ agora token existe
        },
        body: JSON.stringify(dados),
      }
    );

    const data = await response.json();
    return {
      success: data.success,
      message: data.message,
      doacao: data.data || null,
    };
  },

  // ========= CAMPANHAS =========
  async getCampanhas() {
    const response = await fetch(`${API_BASE_URL}/hemocentro/api/campanhas`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async criarCampanha(dados) {
    const response = await fetch(`${API_BASE_URL}/hemocentro/api/campanhas`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(dados),
    });
    return handleResponse(response);
  },

  async editarCampanha(id, dados) {
    const response = await fetch(
      `${API_BASE_URL}/hemocentro/api/campanhas/${id}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(dados),
      }
    );
    return handleResponse(response);
  },

  async excluirCampanha(id) {
    const response = await fetch(
      `${API_BASE_URL}/hemocentro/api/campanhas/${id}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );
    return handleResponse(response);
  },

  async concluirCampanha(id) {
    const response = await fetch(
      `${API_BASE_URL}/hemocentro/api/campanhas/${id}/concluir`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
      }
    );
    return handleResponse(response);
  },

  async getCampanhasDoador() {
    const response = await fetch(`${API_BASE_URL}/doador/api/campanhas`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async alterarSenha({ senha_atual, nova_senha }) {
    const token = this.getToken();
    if (!token) throw new Error("Token não encontrado. Faça login novamente.");

    try {
      const response = await fetch(`${API_BASE_URL}/api/alterar_senha`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          senha_atual,
          nova_senha,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao alterar senha");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("❌ Erro na API (alterarSenha):", error);
      throw error;
    }
  },

  // ✅ Histórico de doações do doador logado
  async getHistoricoDoacoesDoador(doadorId) {
    try {
      const token = authManager.getToken();
      if (!token) throw new Error("Token ausente");
      if (!doadorId) throw new Error("ID do doador não fornecido.");

      const response = await fetch(
        `${API_BASE_URL}/hemocentro/api/historico/${doadorId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      console.log("📦 Resposta da API - Histórico de Doador:", data);

      if (!response.ok) {
        throw new Error(data.message || "Erro ao buscar histórico do doador");
      }

      // Normaliza o formato da resposta
      const lista =
        data.historico || data.data?.historico || data.data?.doacoes || [];
      const doacoesNormalizadas = lista.map((d) => ({
        id: d.id,
        data: d.data || d.data_doacao,
        tipo_doacao: d.tipo_doacao,
        hemocentro: d.hemocentro || d.hemocentro_nome || "Hemocentro",
        status: d.status || "indefinido",
      }));

      return { success: true, historico: doacoesNormalizadas };
    } catch (error) {
      console.error("❌ Erro em getHistoricoDoacoesDoador:", error);
      return { success: false, message: error.message };
    }
  },

  // ========= UTILITÁRIOS =========
  getCurrentUser: () => authManager.getUserData(),
  isAuthenticated: () => authManager.isValid(),
  isDoador: () => authManager.getUserData()?.tipo === "doador",
  isHemocentro: () => authManager.getUserData()?.tipo === "hemocentro",
  getToken: () => authManager.getToken(),
};
