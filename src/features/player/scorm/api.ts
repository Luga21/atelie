/**
 * Descoberta e encapsulamento da API SCORM fornecida pelo LMS.
 *
 * SCORM 1.2  → objeto `API`          (LMSInitialize, LMSGetValue, LMSSetValue, LMSCommit, LMSFinish)
 * SCORM 2004 → objeto `API_1484_11`  (Initialize, GetValue, SetValue, Commit, Terminate)
 *
 * O LMS expõe o objeto em uma janela ancestral (frameset/iframe) ou na janela que abriu o curso.
 */
export type ScormVersion = "1.2" | "2004";

interface Api12 {
  LMSInitialize(p: ""): string;
  LMSGetValue(k: string): string;
  LMSSetValue(k: string, v: string): string;
  LMSCommit(p: ""): string;
  LMSFinish(p: ""): string;
  LMSGetLastError(): string;
  LMSGetErrorString(code: string): string;
}

interface Api2004 {
  Initialize(p: ""): string;
  GetValue(k: string): string;
  SetValue(k: string, v: string): string;
  Commit(p: ""): string;
  Terminate(p: ""): string;
  GetLastError(): string;
  GetErrorString(code: string): string;
}

/** Interface uniforme usada pelo adaptador de progresso. */
export interface ScormConnection {
  version: ScormVersion;
  get(key: string): string;
  set(key: string, value: string): boolean;
  commit(): boolean;
  finish(): boolean;
  lastError(): string;
}

function findIn(win: Window, name: "API" | "API_1484_11"): unknown {
  let w: Window | null = win;
  for (let depth = 0; w && depth < 10; depth++) {
    try {
      const api = (w as unknown as Record<string, unknown>)[name];
      if (api) return api;
    } catch {
      return null; // janela de outra origem
    }
    if (w.parent === w) break;
    w = w.parent;
  }
  return null;
}

function discover(name: "API" | "API_1484_11"): unknown {
  if (typeof window === "undefined") return null;
  return findIn(window, name) ?? (window.opener ? findIn(window.opener as Window, name) : null);
}

/** Localiza e inicializa a sessão SCORM. Retorna null se o LMS não fornecer a API. */
export function connectScorm(version: ScormVersion): ScormConnection | null {
  if (version === "1.2") {
    const api = discover("API") as Api12 | null;
    if (!api || String(api.LMSInitialize("")) !== "true") return null;
    let finished = false;
    return {
      version,
      get: (k) => String(api.LMSGetValue(k) ?? ""),
      set: (k, v) => String(api.LMSSetValue(k, v)) === "true",
      commit: () => !finished && String(api.LMSCommit("")) === "true",
      finish: () => {
        if (finished) return true;
        finished = true;
        return String(api.LMSFinish("")) === "true";
      },
      lastError: () => {
        const code = String(api.LMSGetLastError());
        return code === "0" ? "" : `${code}: ${api.LMSGetErrorString(code)}`;
      },
    };
  }
  const api = discover("API_1484_11") as Api2004 | null;
  if (!api || String(api.Initialize("")) !== "true") return null;
  let finished = false;
  return {
    version,
    get: (k) => String(api.GetValue(k) ?? ""),
    set: (k, v) => String(api.SetValue(k, v)) === "true",
    commit: () => !finished && String(api.Commit("")) === "true",
    finish: () => {
      if (finished) return true;
      finished = true;
      return String(api.Terminate("")) === "true";
    },
    lastError: () => {
      const code = String(api.GetLastError());
      return code === "0" ? "" : `${code}: ${api.GetErrorString(code)}`;
    },
  };
}

/** Duração da sessão no formato exigido por cada versão. */
export function formatSessionTime(ms: number, version: ScormVersion): string {
  const total = Math.max(0, Math.round(ms / 10) / 100); // segundos com 2 casas
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total - h * 3600 - m * 60;
  if (version === "1.2") {
    // HHHH:MM:SS.SS
    return `${String(h).padStart(4, "0")}:${String(m).padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}`;
  }
  // ISO 8601: PT#H#M#S
  return `PT${h}H${m}M${s.toFixed(2)}S`;
}
