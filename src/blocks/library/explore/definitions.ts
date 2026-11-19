import type { MediaRef } from "@/core/model/types";
import { uid } from "@/core/model/ids";
import type { BlockDefinition } from "../../engine/definition";

/* -------------------------------------------------------- Cards clicáveis */
export interface RevealCard { id: string; title: string; summary: string; html: string; media: MediaRef | null }
export interface RevealCardsContent { cards: RevealCard[] }
export interface RevealCardsSettings { columns: 2 | 3; showImages: boolean; trackProgress: boolean }
export const revealCardsBlock: BlockDefinition<RevealCardsContent, RevealCardsSettings> = {
  type: "reveal-cards",
  version: 1,
  category: "interactive",
  name: "Cards clicáveis",
  description: "Cards que revelam detalhes ao clicar, com contagem do que foi explorado.",
  keywords: ["cards", "clicáveis", "revelar", "explorar", "detalhes"],
  create: () => ({
    content: {
      cards: [
        { id: uid("k"), title: "Conceito A", summary: "Clique para saber mais", html: "<p>Explicação detalhada do conceito A.</p>", media: null },
        { id: uid("k"), title: "Conceito B", summary: "Clique para saber mais", html: "<p>Explicação detalhada do conceito B.</p>", media: null },
        { id: uid("k"), title: "Conceito C", summary: "Clique para saber mais", html: "<p>Explicação detalhada do conceito C.</p>", media: null },
      ],
    },
    settings: { columns: 3, showImages: false, trackProgress: true },
  }),
};

/* ------------------------------------------- Imagem com marcadores (hotspots) */
export interface Hotspot { id: string; x: number; y: number; title: string; html: string }
export interface HotspotsContent { media: MediaRef | null; alt: string; markers: Hotspot[] }
export interface HotspotsSettings { markerStyle: "numbered" | "plus"; pulse: boolean; trackProgress: boolean }
export const hotspotsBlock: BlockDefinition<HotspotsContent, HotspotsSettings> = {
  type: "hotspots",
  version: 1,
  category: "interactive",
  name: "Imagem com marcadores",
  description: "Marcadores clicáveis sobre uma imagem: telas, equipamentos, mapas.",
  keywords: ["hotspot", "marcadores", "imagem interativa", "pontos", "tela", "mapa"],
  create: () => ({
    content: {
      media: null,
      alt: "",
      markers: [
        { id: uid("h"), x: 28, y: 35, title: "Primeiro ponto", html: "<p>Descreva este elemento da imagem.</p>" },
        { id: uid("h"), x: 68, y: 60, title: "Segundo ponto", html: "<p>Descreva este elemento da imagem.</p>" },
      ],
    },
    settings: { markerStyle: "numbered", pulse: true, trackProgress: true },
  }),
};

/* ---------------------------------------------------------- Linha do tempo */
export interface TimelineItem { id: string; date: string; title: string; html: string; media: MediaRef | null }
export interface TimelineContent { items: TimelineItem[] }
export interface TimelineSettings { layout: "vertical" | "alternate"; showImages: boolean }
export const timelineBlock: BlockDefinition<TimelineContent, TimelineSettings> = {
  type: "timeline",
  version: 1,
  category: "interactive",
  name: "Linha do tempo",
  description: "Eventos ou marcos em sequência cronológica.",
  keywords: ["linha do tempo", "timeline", "história", "marcos", "cronologia", "jornada"],
  create: () => ({
    content: {
      items: [
        { id: uid("t"), date: "Etapa 1", title: "Início", html: "<p>O que acontece neste momento.</p>", media: null },
        { id: uid("t"), date: "Etapa 2", title: "Desenvolvimento", html: "<p>O que acontece neste momento.</p>", media: null },
        { id: uid("t"), date: "Etapa 3", title: "Resultado", html: "<p>O que acontece neste momento.</p>", media: null },
      ],
    },
    settings: { layout: "vertical", showImages: false },
  }),
};

/* ------------------------------------------------------------------ Tabela */
export interface TableColumn { id: string; label: string }
export interface TableRow { id: string; cells: string[] }
export interface TableContent { caption: string; columns: TableColumn[]; rows: TableRow[] }
export interface TableSettings { headerRow: boolean; firstColumnHeader: boolean; striped: boolean; compact: boolean }
export const tableBlock: BlockDefinition<TableContent, TableSettings> = {
  type: "table",
  version: 1,
  category: "layout",
  name: "Tabela",
  description: "Dados organizados em linhas e colunas, editáveis no canvas.",
  keywords: ["tabela", "dados", "comparação", "planilha", "matriz"],
  create: () => ({
    content: {
      caption: "",
      columns: [{ id: uid("col"), label: "Item" }, { id: uid("col"), label: "Descrição" }, { id: uid("col"), label: "Responsável" }],
      rows: [
        { id: uid("r"), cells: ["Item 1", "Descrição do item", "Equipe A"] },
        { id: uid("r"), cells: ["Item 2", "Descrição do item", "Equipe B"] },
      ],
    },
    settings: { headerRow: true, firstColumnHeader: false, striped: true, compact: false },
  }),
};
