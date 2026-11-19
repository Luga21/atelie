import { uid } from "@/core/model/ids";
import type { BlockDefinition } from "../../engine/definition";

/**
 * Modelo único para atividades de escolha (múltipla escolha, múltipla seleção, V/F).
 * A correção fica em cada opção (`correct`), sem referências cruzadas de id,
 * o que torna duplicação e importação seguras.
 */
export interface ChoiceOption {
  id: string;
  text: string;
  correct: boolean;
  /** Explicação exibida quando esta opção é escolhida (feedback contextualizado). */
  feedback: string;
}

export interface ChoiceContent {
  question: string; // HTML
  options: ChoiceOption[];
  feedbackCorrect: string;
  feedbackIncorrect: string;
}

export interface ChoiceSettings {
  /** 0 = tentativas ilimitadas. */
  attempts: 0 | 1 | 2 | 3;
  shuffle: boolean;
  showCorrectAnswer: boolean;
  showOptionFeedback: boolean;
  points: number;
}

export type ChoiceMode = "single" | "multiple" | "truefalse";

export const CHOICE_MODE: Record<string, ChoiceMode> = {
  "multiple-choice": "single",
  "multiple-select": "multiple",
  "true-false": "truefalse",
};

const opt = (text: string, correct: boolean, feedback = ""): ChoiceOption => ({ id: uid("o"), text, correct, feedback });

const baseSettings = (): ChoiceSettings => ({
  attempts: 0,
  shuffle: false,
  showCorrectAnswer: true,
  showOptionFeedback: true,
  points: 1,
});

const scoring = { maxScore: (d: { settings: ChoiceSettings }) => d.settings.points };

export const multipleChoiceBlock: BlockDefinition<ChoiceContent, ChoiceSettings> = {
  type: "multiple-choice",
  version: 1,
  category: "activity",
  name: "Múltipla escolha",
  description: "Uma resposta correta entre várias opções, com feedback.",
  keywords: ["quiz", "pergunta", "múltipla escolha", "avaliação", "questão"],
  create: () => ({
    content: {
      question: "<p>Qual é a pergunta que o aluno deve responder?</p>",
      options: [
        opt("Opção correta", true, "Isso mesmo! Explique por que esta é a resposta."),
        opt("Opção incorreta", false, "Explique o equívoco desta alternativa."),
        opt("Outra opção incorreta", false, "Explique o equívoco desta alternativa."),
      ],
      feedbackCorrect: "Resposta correta!",
      feedbackIncorrect: "Ainda não. Revise o conteúdo e tente novamente.",
    },
    settings: baseSettings(),
  }),
  scoring,
};

export const multipleSelectBlock: BlockDefinition<ChoiceContent, ChoiceSettings> = {
  type: "multiple-select",
  version: 1,
  category: "activity",
  name: "Múltipla seleção",
  description: "Várias respostas corretas; o aluno marca todas as que se aplicam.",
  keywords: ["quiz", "checkbox", "múltipla seleção", "várias respostas", "avaliação"],
  create: () => ({
    content: {
      question: "<p>Selecione todas as alternativas corretas.</p>",
      options: [
        opt("Alternativa correta A", true, "Correta: explique por quê."),
        opt("Alternativa correta B", true, "Correta: explique por quê."),
        opt("Alternativa incorreta", false, "Incorreta: explique o equívoco."),
        opt("Outra alternativa incorreta", false, "Incorreta: explique o equívoco."),
      ],
      feedbackCorrect: "Perfeito! Você identificou todas as alternativas corretas.",
      feedbackIncorrect: "Quase. Confira quais alternativas se aplicam e tente novamente.",
    },
    settings: baseSettings(),
  }),
  scoring,
};

export const trueFalseBlock: BlockDefinition<ChoiceContent, ChoiceSettings> = {
  type: "true-false",
  version: 1,
  category: "activity",
  name: "Verdadeiro ou falso",
  description: "Afirmação para o aluno julgar, com explicação.",
  keywords: ["verdadeiro", "falso", "v ou f", "afirmação", "quiz"],
  create: () => ({
    content: {
      question: "<p>Escreva aqui uma afirmação para o aluno julgar.</p>",
      options: [
        opt("Verdadeiro", true, "A afirmação é verdadeira porque…"),
        opt("Falso", false, "Na verdade, a afirmação é verdadeira porque…"),
      ],
      feedbackCorrect: "Correto!",
      feedbackIncorrect: "Não exatamente.",
    },
    settings: baseSettings(),
  }),
  scoring,
};

/** Avalia uma resposta. Função pura, compartilhada por player e testes. */
export function evaluateChoice(content: ChoiceContent, selected: string[]): boolean {
  const correct = content.options.filter((o) => o.correct).map((o) => o.id).sort();
  const chosen = [...new Set(selected)].sort();
  return correct.length === chosen.length && correct.every((id, i) => id === chosen[i]);
}
