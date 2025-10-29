// ==========================================
// 🔐 AUTH MANAGER MULTIUSUÁRIO (Doador + Hemocentro)
// ==========================================

const STORAGE_KEYS = {
  doador: "hemosys_auth_doador",
  hemocentro: "hemosys_auth_hemocentro",
};

let currentAuth = null;
let currentType = null;

// ===================================================
// 🧩 Função interna - restaura sessão de um tipo
// ===================================================
const restoreFromStorage = (tipo = "doador") => {
  const key = STORAGE_KEYS[tipo];
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Expira após 24h
      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        currentAuth = parsed;
        currentType = tipo;
        console.log(
          `♻️ Sessão restaurada (${tipo}) para: ${parsed.userData?.nome}`
        );
        return true;
      } else {
        console.warn(`⚠️ Sessão expirada (${tipo}), limpando...`);
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error(`❌ Erro ao restaurar sessão (${tipo}):`, error);
    localStorage.removeItem(key);
  }
  return false;
};

// ===================================================
// 🧠 Auth Manager principal
// ===================================================
export const authManager = {
  // ==============================
  // 🔑 SALVAR AUTENTICAÇÃO
  // ==============================
  setAuth: (token, userData) => {
  if (!userData || !token) {
    console.error("❌ setAuth chamado com dados inválidos:", { token, userData });
    return;
  }

  const tipo = userData.tipo || "doador";
  const key = STORAGE_KEYS[tipo];

  // 🔥 Limpa o outro tipo antes de definir o novo
  const outroTipo = tipo === "doador" ? "hemocentro" : "doador";
  localStorage.removeItem(STORAGE_KEYS[outroTipo]);

  // 🧠 Atualiza estado atual
  currentAuth = { token, userData, timestamp: Date.now() };
  currentType = tipo;

  // 💾 Salva no localStorage
  localStorage.setItem(key, JSON.stringify(currentAuth));

  console.log(`🔐 Sessão salva (${tipo}) para: ${userData?.nome}`);
},

  // ==============================
  // 📦 GETTERS
  // ==============================
  getToken: () => currentAuth?.token || null,
  getTokenByType: (tipo) => {
    const saved = localStorage.getItem(STORAGE_KEYS[tipo]);
    if (!saved) return null;
    try {
      return JSON.parse(saved)?.token || null;
    } catch {
      return null;
    }
  },
  getUserData: () => currentAuth?.userData || null,
  getUserType: () => currentAuth?.userData?.tipo || currentType,
  getUserId: () => currentAuth?.userData?.id || null,

  // ==============================
  // 🚪 LIMPAR / LOGOUT
  // ==============================
  clear: (tipo = null) => {
    if (tipo) {
      const key = STORAGE_KEYS[tipo];
      console.log(`🔓 Logout (${tipo})`);
      localStorage.removeItem(key);
    } else {
      console.log("🔓 Logout completo (todos os tipos)");
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    }
    currentAuth = null;
    currentType = null;
  },

  // ==============================
  // 🧠 VERIFICAÇÕES
  // ==============================
  isValid: () => {
    if (!currentAuth) return false;
    const expired = Date.now() - currentAuth.timestamp >= 24 * 60 * 60 * 1000;
    if (expired) {
      console.warn("⚠️ Sessão expirada automaticamente.");
      authManager.clear(currentType);
      return false;
    }
    return true;
  },

  isDoador: () => currentAuth?.userData?.tipo === "doador",
  isHemocentro: () => currentAuth?.userData?.tipo === "hemocentro",

  // ==============================
  // 🧩 UTILITÁRIOS
  // ==============================
  restore: restoreFromStorage,
  getAuth: () => currentAuth,
};

// ===================================================
// 🚀 Restaura automaticamente a sessão mais recente
// ===================================================
try {
  const hemocentroSaved = localStorage.getItem(STORAGE_KEYS.hemocentro);
  const doadorSaved = localStorage.getItem(STORAGE_KEYS.doador);

  // ⚙️ Impede que uma restauração sobrescreva outra se já há uma ativa
  if (!currentAuth) {
    if (hemocentroSaved && doadorSaved) {
      const hemocentroData = JSON.parse(hemocentroSaved);
      const doadorData = JSON.parse(doadorSaved);
      const maisRecente =
        hemocentroData.timestamp > doadorData.timestamp
          ? "hemocentro"
          : "doador";
      authManager.restore(maisRecente);
    } else if (hemocentroSaved) {
      authManager.restore("hemocentro");
    } else if (doadorSaved) {
      authManager.restore("doador");
    }
  }
} catch (err) {
  console.error("❌ Erro ao restaurar sessão automaticamente:", err);
}
