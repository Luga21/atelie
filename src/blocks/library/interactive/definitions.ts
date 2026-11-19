import type { MediaRef } from "@/core/model/types";
import { uid } from "@/core/model/ids";
import type { BlockDefinition } from "../../engine/definition";

/* -------------------------------------------------------------- Acordeão */
export interface AccordionItem { id: string; title: string; html: string }
export interface AccordionContent { items: AccordionItem[] }
export interface AccordionSettings { allowMultiple: boolean; firstOpen: boolean }
export const accordionBlock: BlockDefinition<AccordionContent, AccordionSettings> = {
  type: "accordion",
  version: 1,
  category: "interactive",
  name: "Acordeão",
  description: "Seções expansíveis para revelar conteúdo sob demanda.",
  keywords: ["acordeão", "expandir", "faq", "perguntas frequentes", "seções"],
  create: () => ({
    content: {
      items: [
        { id: uid("i"), title: "O que é este tópico?", html: "<p>Explique o tópico de forma objetiva.</p>" },
        { id: uid("i"), title: "Por que ele é importante?", html: "<p>Mostre o impacto no dia a dia.</p>" },
        { id: uid("i"), title: "Como aplicar na prática?", html: "<p>Dê um exemplo concreto.</p>" },
      ],
    },
    settings: { allowMultiple: false, firstOpen: false },
  }),
};

/* ------------------------------------------------------------------- Abas */
export interface TabItem { id: string; title: string; html: string; media: MediaRef | null }
export interface TabsContent { items: TabItem[] }
export interface TabsSettings { style: "underline" | "pills"; showImages: boolean }
export const tabsBlock: BlockDefinition<TabsContent, TabsSettings> = {
  type: "tabs",
  version: 1,
  category: "interactive",
  name: "Abas",
  description: "Organiza conteúdos relacionados em abas alternáveis.",
  keywords: ["abas", "tabs", "categorias", "alternar"],
  create: () => ({
    content: {
      items: [
        { id: uid("t"), title: "Visão geral", html: "<p>Conteúdo da primeira aba.</p>", media: null },
        { id: uid("t"), title: "Detalhes", html: "<p>Conteúdo da segunda aba.</p>", media: null },
        { id: uid("t"), title: "Exemplo", html: "<p>Conteúdo da terceira aba.</p>", media: null },
      ],
    },
    settings: { style: "underline", showImages: false },
  }),
};

/* ------------------------------------------------------------- Flashcards */
export interface Flashcard { id: string; front: string; back: string; frontMedia: MediaRef | null; backMedia: MediaRef | null }
export interface FlashcardsContent { cards: Flashcard[] }
export interface FlashcardsSettings { layout: "grid" | "stack"; columns: 2 | 3; height: "s" | "m" | "l"; frontStyle: "primary" | "surface" }
export const flashcardsBlock: BlockDefinition<FlashcardsContent, FlashcardsSettings> = {
  type: "flashcards",
  version: 1,
  category: "interactive",
  name: "Flashcards",
  description: "Cards que viram ao clicar, com frente e verso.",
  keywords: ["flashcards", "cards", "virar", "memorização", "revisão"],
  create: () => ({
    content: {
      cards: [
        { id: uid("f"), front: "Termo 1", back: "Definição do termo 1", frontMedia: null, backMedia: null },
        { id: uid("f"), front: "Termo 2", back: "Definição do termo 2", frontMedia: null, backMedia: null },
        { id: uid("f"), front: "Termo 3", back: "Definição do termo 3", frontMedia: null, backMedia: null },
      ],
    },
    settings: { layout: "grid", columns: 3, height: "m", frontStyle: "primary" },
  }),
};

/* ------------------------------------------------------ Processo em etapas */
export interface ProcessStep { id: string; title: string; html: string; media: MediaRef | null }
export interface ProcessContent {
  introTitle: string;
  introHtml: string;
  steps: ProcessStep[];
  summaryTitle: string;
  summaryHtml: string;
}
export interface ProcessSettings { showIntro: boolean; showSummary: boolean; numbered: boolean }
export const processBlock: BlockDefinition<ProcessContent, ProcessSettings> = {
  type: "process",
  version: 1,
  category: "interactive",
  name: "Processo em etapas",
  description: "Guia o aluno por um procedimento, uma etapa por vez.",
  keywords: ["processo", "etapas", "passo a passo", "procedimento", "tutorial"],
  create: () => ({
    content: {
      introTitle: "Como funciona o processo",
      introHtml: "<p>Acompanhe cada etapa clicando em avançar.</p>",
      steps: [
        { id: uid("s"), title: "Preparar", html: "<p>Descreva o que fazer nesta etapa.</p>", media: null },
        { id: uid("s"), title: "Executar", html: "<p>Descreva o que fazer nesta etapa.</p>", media: null },
        { id: uid("s"), title: "Revisar", html: "<p>Descreva o que fazer nesta etapa.</p>", media: null },
      ],
      summaryTitle: "Resumo",
      summaryHtml: "<p>Recapitule os pontos-chave do processo.</p>",
    },
    settings: { showIntro: true, showSummary: true, numbered: true },
  }),
};
