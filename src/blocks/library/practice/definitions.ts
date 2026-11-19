import { uid } from "@/core/model/ids";
import type { BlockDefinition } from "../../engine/definition";

interface GradedSettings {
  /** 0 = tentativas ilimitadas. */
  attempts: 0 | 1 | 2 | 3;
  showCorrectAnswer: boolean;
  points: number;
}

const graded = (): GradedSettings => ({ attempts: 0, showCorrectAnswer: true, points: 1 });

/* ------------------------------------------------- Associação de colunas */
export interface MatchPair { id: string; left: string; right: string }
export interface MatchingContent { prompt: string; pairs: MatchPair[]; feedbackCorrect: string; feedbackIncorrect: string }
export type MatchingSettings = GradedSettings;
export const matchingBlock: BlockDefinition<MatchingContent, MatchingSettings> = {
  type: "matching",
  version: 1,
  category: "activity",
  name: "Associação de colunas",
  description: "O aluno liga cada item da esquerda ao correspondente da direita.",
  keywords: ["associação", "ligar", "relacionar", "pares", "colunas", "correspondência"],
  create: () => ({
    content: {
      prompt: "<p>Associe cada termo à sua definição.</p>",
      pairs: [
        { id: uid("p"), left: "Termo A", right: "Definição de A" },
        { id: uid("p"), left: "Termo B", right: "Definição de B" },
        { id: uid("p"), left: "Termo C", right: "Definição de C" },
      ],
      feedbackCorrect: "Muito bem! Todas as associações estão corretas.",
      feedbackIncorrect: "Algumas associações não estão corretas. Revise as marcadas em vermelho.",
    },
    settings: graded(),
  }),
  scoring: { maxScore: (d) => d.settings.points },
};

/** Retorna, para cada par, se a escolha do aluno (leftId → rightId) está correta. */
export function evaluateMatching(content: MatchingContent, answer: Record<string, string>) {
  const results = content.pairs.map((p) => answer[p.id] === p.id);
  return { results, correct: results.filter(Boolean).length, total: results.length };
}

/* ------------------------------------------------ Ordenar (arrastar e soltar) */
export interface SortItem { id: string; text: string }
export interface SortingContent { prompt: string; items: SortItem[]; feedbackCorrect: string; feedbackIncorrect: string }
export type SortingSettings = GradedSettings;
export const sortingBlock: BlockDefinition<SortingContent, SortingSettings> = {
  type: "sorting",
  version: 1,
  category: "activity",
  name: "Ordenar (arrastar e soltar)",
  description: "O aluno arrasta os itens para colocá-los na sequência correta.",
  keywords: ["arrastar", "soltar", "ordenar", "sequência", "drag and drop", "passos"],
  create: () => ({
    content: {
      prompt: "<p>Arraste os passos para colocá-los na ordem correta.</p>",
      items: [
        { id: uid("s"), text: "Primeiro passo" },
        { id: uid("s"), text: "Segundo passo" },
        { id: uid("s"), text: "Terceiro passo" },
        { id: uid("s"), text: "Quarto passo" },
      ],
      feedbackCorrect: "Sequência correta!",
      feedbackIncorrect: "A ordem ainda não está correta. Os itens fora de posição estão destacados.",
    },
    settings: graded(),
  }),
  scoring: { maxScore: (d) => d.settings.points },
};

/* -------------------------------------------------------- Pergunta aberta */
export interface OpenQuestionContent { question: string; placeholder: string; modelAnswer: string }
export interface OpenQuestionSettings { showModelAnswer: boolean; minLength: number }
export const openQuestionBlock: BlockDefinition<OpenQuestionContent, OpenQuestionSettings> = {
  type: "open-question",
  version: 1,
  category: "activity",
  name: "Pergunta aberta",
  description: "Resposta livre para reflexão, com resposta de referência para comparação.",
  keywords: ["pergunta aberta", "dissertativa", "reflexão", "resposta livre", "texto"],
  create: () => ({
    content: {
      question: "<p>Como você aplicaria este conceito no seu dia a dia?</p>",
      placeholder: "Escreva sua resposta…",
      modelAnswer: "<p>Uma boa resposta menciona…</p>",
    },
    settings: { showModelAnswer: true, minLength: 20 },
  }),
  // Sem nota: conta apenas como atividade concluída.
  scoring: { maxScore: () => 0 },
};
