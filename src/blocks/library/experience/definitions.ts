import type { MediaRef } from "@/core/model/types";
import { uid } from "@/core/model/ids";
import type { BlockDefinition } from "../../engine/definition";

/* ------------------------------------------------------ Cenário ramificado */
/**
 * Referências internas (choice.target → scene.id) ficam restritas ao próprio bloco.
 * Duplicar o bloco preserva os ids internos (só o id do bloco muda), então elas continuam válidas.
 */
export const END = "__end__";
export interface ScenarioChoice { id: string; text: string; feedback: string; target: string }
export interface ScenarioScene {
  id: string;
  title: string;
  html: string;
  media: MediaRef | null;
  choices: ScenarioChoice[];
  /** Cenas sem escolhas são finais; o desfecho define a mensagem e a pontuação. */
  outcome: "success" | "neutral" | "failure";
}
export interface ScenarioContent { title: string; intro: string; startSceneId: string; scenes: ScenarioScene[] }
export interface ScenarioSettings { showFeedback: boolean; points: number; allowRestart: boolean }

export function createScene(title: string, outcome: ScenarioScene["outcome"] = "neutral"): ScenarioScene {
  return { id: uid("sc"), title, html: "<p>Descreva a situação.</p>", media: null, choices: [], outcome };
}

export const scenarioBlock: BlockDefinition<ScenarioContent, ScenarioSettings> = {
  type: "scenario",
  version: 1,
  category: "experience",
  name: "Cenário ramificado",
  description: "Situação-problema com escolhas que levam a caminhos e desfechos diferentes.",
  keywords: ["cenário", "ramificado", "simulação", "situação-problema", "decisão", "escolhas", "desafio"],
  create: () => {
    const start = createScene("Um cliente insatisfeito liga");
    const good = createScene("O cliente se acalma", "success");
    const bad = createScene("O cliente pede para falar com o gerente", "failure");
    start.html = "<p>O cliente relata que o pedido chegou errado e está irritado. O que você faz?</p>";
    good.html = "<p>Você ouviu com atenção, reconheceu o problema e propôs uma solução. O cliente agradece.</p>";
    bad.html = "<p>O cliente sentiu que não foi ouvido e a situação escalou.</p>";
    start.choices = [
      { id: uid("ch"), text: "Ouço com atenção e peço desculpas pelo transtorno", feedback: "Empatia primeiro reduz a tensão.", target: good.id },
      { id: uid("ch"), text: "Explico que o erro foi da transportadora", feedback: "Transferir a culpa aumenta a frustração.", target: bad.id },
    ];
    return {
      content: { title: "Situação-problema", intro: "Tome decisões e veja as consequências.", startSceneId: start.id, scenes: [start, good, bad] },
      settings: { showFeedback: true, points: 1, allowRestart: true },
    };
  },
  scoring: { maxScore: (d) => d.settings.points },
};

/* ------------------------------------------------ Etapa com desbloqueio */
export interface GateContent { label: string; lockedMessage: string }
export interface GateSettings { requireActivities: boolean }
export const gateBlock: BlockDefinition<GateContent, GateSettings> = {
  type: "gate",
  version: 1,
  category: "experience",
  name: "Etapa com desbloqueio",
  description: "Oculta o restante da aula até o aluno continuar ou concluir as atividades acima.",
  keywords: ["continuar", "desbloqueio", "bloqueio", "etapas", "progressão", "gamificação"],
  create: () => ({
    content: { label: "Continuar", lockedMessage: "Conclua as atividades acima para continuar." },
    settings: { requireActivities: true },
    style: { padding: "s" },
  }),
};

/* --------------------------------------------- Feedback de desempenho */
export interface PerformanceContent { title: string; high: string; medium: string; low: string; empty: string }
export interface PerformanceSettings { scope: "lesson" | "course"; highThreshold: number; lowThreshold: number }
export const performanceBlock: BlockDefinition<PerformanceContent, PerformanceSettings> = {
  type: "performance",
  version: 1,
  category: "experience",
  name: "Feedback de desempenho",
  description: "Mostra ao aluno a pontuação das atividades, com mensagem por faixa de resultado.",
  keywords: ["desempenho", "resultado", "pontuação", "placar", "feedback", "gamificação"],
  create: () => ({
    content: {
      title: "Seu desempenho",
      high: "Excelente! Você domina este conteúdo.",
      medium: "Bom trabalho! Revise os pontos em que teve dúvida.",
      low: "Vale a pena revisar o conteúdo e tentar novamente.",
      empty: "Responda às atividades para ver seu desempenho.",
    },
    settings: { scope: "lesson", highThreshold: 80, lowThreshold: 50 },
  }),
};
