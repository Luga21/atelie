/**
 * Entrada do player standalone (empacotado por scripts/build-runtime.mjs em public/runtime/).
 * O pacote exportado define antes deste script:
 *   window.__COURSE__         → documento do treinamento
 *   window.__ASSETS__         → id da mídia → caminho relativo em media/
 *   window.__EXPORT_TARGET__  → "html" | "scorm12" | "scorm2004"
 * Funciona inclusive via file://.
 */
import { createRoot } from "react-dom/client";
import "@/styles/course.css";
import { normalizeCourse } from "@/core/model/schema";
import type { Course } from "@/core/model/types";
import type { MediaResolver } from "@/blocks/engine/context";
import { CoursePlayer } from "@/features/player/CoursePlayer";
import { createLocalProgress, type ProgressAdapter } from "@/features/player/progress";
import { createScormProgress } from "@/features/player/scorm/adapter";

declare global {
  interface Window {
    __COURSE__?: unknown;
    __ASSETS__?: Record<string, string>;
    __EXPORT_TARGET__?: "html" | "scorm12" | "scorm2004";
  }
}

const assets = window.__ASSETS__ ?? {};
const resolver: MediaResolver = {
  peek: (id) => assets[id] ?? null,
  load: async (id) => assets[id] ?? null,
};

function showNotice(text: string) {
  const el = document.createElement("div");
  el.setAttribute("role", "status");
  el.style.cssText =
    "position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9999;max-width:min(560px,92vw);padding:10px 16px;border-radius:10px;" +
    "background:#1b1d24;color:#e7e8ed;font:13px/1.4 system-ui,sans-serif;box-shadow:0 10px 30px rgb(0 0 0/.35);cursor:pointer";
  el.textContent = `${text} (clique para fechar)`;
  el.onclick = () => el.remove();
  document.body.appendChild(el);
}

function createProgress(course: Course): ProgressAdapter {
  const target = window.__EXPORT_TARGET__ ?? "html";
  if (target === "scorm12" || target === "scorm2004") {
    const scorm = createScormProgress(course, target === "scorm12" ? "1.2" : "2004");
    if (scorm) {
      const end = () => scorm.terminate();
      window.addEventListener("pagehide", end);
      window.addEventListener("beforeunload", end);
      return scorm;
    }
    console.warn("[SCORM] API do LMS não encontrada; usando progresso local.");
    showNotice("Pacote SCORM aberto fora de um LMS: o progresso será salvo apenas neste navegador.");
  }
  return createLocalProgress(course.id);
}

const mount = document.getElementById("app");
if (mount) {
  try {
    const course = normalizeCourse(window.__COURSE__);
    document.title = course.title;
    document.body.style.background = course.theme.colors.background;
    createRoot(mount).render(<CoursePlayer course={course} resolver={resolver} progress={createProgress(course)} />);
  } catch (err) {
    mount.textContent = `Não foi possível carregar o treinamento: ${(err as Error).message}`;
  }
}
