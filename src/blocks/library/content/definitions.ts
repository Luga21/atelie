import type { MediaRef } from "@/core/model/types";
import { uid } from "@/core/model/ids";
import type { BlockDefinition } from "../../engine/definition";

export type Align = "left" | "center" | "right";

/* ------------------------------------------------------------------ Texto */
export interface TextContent { html: string }
export interface TextSettings { variant: "paragraph" | "lead" | "callout"; align: "left" | "center" }
export const textBlock: BlockDefinition<TextContent, TextSettings> = {
  type: "text",
  version: 1,
  category: "content",
  name: "Texto",
  description: "Parágrafos com formatação: negrito, itálico, links e listas.",
  keywords: ["parágrafo", "texto", "conteúdo", "destaque", "nota"],
  create: () => ({
    content: { html: "<p>Escreva aqui o conteúdo. Selecione um trecho para formatar.</p>" },
    settings: { variant: "paragraph", align: "left" },
  }),
};

/* ----------------------------------------------------------------- Título */
export interface HeadingContent { title: string; subtitle: string }
export interface HeadingSettings { size: "h1" | "h2" | "h3"; align: "left" | "center"; showSubtitle: boolean; accentLine: boolean }
export const headingBlock: BlockDefinition<HeadingContent, HeadingSettings> = {
  type: "heading",
  version: 1,
  category: "content",
  name: "Título e subtítulo",
  description: "Abre uma seção com título forte e subtítulo opcional.",
  keywords: ["título", "cabeçalho", "seção", "subtítulo"],
  create: () => ({
    content: { title: "Título da seção", subtitle: "Um subtítulo curto que contextualiza o que vem a seguir." },
    settings: { size: "h2", align: "left", showSubtitle: true, accentLine: true },
  }),
};

/* ----------------------------------------------------------------- Imagem */
export interface ImageContent { media: MediaRef | null; alt: string; caption: string }
export interface ImageSettings { size: "s" | "m" | "l" | "full"; align: Align; rounded: boolean; zoom: boolean }
export const imageBlock: BlockDefinition<ImageContent, ImageSettings> = {
  type: "image",
  version: 1,
  category: "content",
  name: "Imagem",
  description: "Imagem com legenda, texto alternativo e ampliação.",
  keywords: ["imagem", "foto", "figura", "ilustração"],
  create: () => ({
    content: { media: null, alt: "", caption: "" },
    settings: { size: "l", align: "center", rounded: true, zoom: true },
  }),
};

/* ------------------------------------------------------- Texto com imagem */
export interface TextImageContent { title: string; html: string; media: MediaRef | null; alt: string }
export interface TextImageSettings { imageSide: "left" | "right"; imageRatio: "1/3" | "1/2"; verticalAlign: "top" | "center"; showTitle: boolean }
export const textImageBlock: BlockDefinition<TextImageContent, TextImageSettings> = {
  type: "text-image",
  version: 1,
  category: "content",
  name: "Texto com imagem",
  description: "Texto ao lado de uma imagem, com lado e proporção configuráveis.",
  keywords: ["imagem", "texto", "lado a lado", "mídia"],
  create: () => ({
    content: {
      title: "Um conceito importante",
      html: "<p>Explique o conceito com suas palavras. A imagem ao lado reforça a mensagem.</p>",
      media: null,
      alt: "",
    },
    settings: { imageSide: "right", imageRatio: "1/2", verticalAlign: "center", showTitle: true },
  }),
};

/* ------------------------------------------------------------------ Vídeo */
export interface VideoContent { source: MediaRef | null; caption: string }
export interface VideoSettings { aspect: "16:9" | "4:3" | "1:1" | "9:16" }
export const videoBlock: BlockDefinition<VideoContent, VideoSettings> = {
  type: "video",
  version: 1,
  category: "content",
  name: "Vídeo",
  description: "YouTube, Vimeo, link direto ou arquivo de vídeo enviado.",
  keywords: ["vídeo", "youtube", "vimeo", "mp4", "mídia"],
  create: () => ({ content: { source: null, caption: "" }, settings: { aspect: "16:9" } }),
};

/* ------------------------------------------------------------------ Lista */
export interface ListItem { id: string; text: string }
export interface ListContent { title: string; items: ListItem[] }
export interface ListSettings { style: "bullet" | "number" | "check"; columns: 1 | 2; showTitle: boolean }
export const listBlock: BlockDefinition<ListContent, ListSettings> = {
  type: "list",
  version: 1,
  category: "content",
  name: "Lista",
  description: "Itens com marcadores, números ou checklist.",
  keywords: ["lista", "itens", "tópicos", "checklist", "passos"],
  create: () => ({
    content: {
      title: "Pontos principais",
      items: [
        { id: uid("i"), text: "Primeiro ponto importante" },
        { id: uid("i"), text: "Segundo ponto importante" },
        { id: uid("i"), text: "Terceiro ponto importante" },
      ],
    },
    settings: { style: "bullet", columns: 1, showTitle: true },
  }),
};

/* ---------------------------------------------------------------- Citação */
export interface QuoteContent { text: string; author: string; role: string }
export interface QuoteSettings { style: "classic" | "highlight" }
export const quoteBlock: BlockDefinition<QuoteContent, QuoteSettings> = {
  type: "quote",
  version: 1,
  category: "content",
  name: "Citação",
  description: "Destaque uma frase, depoimento ou princípio.",
  keywords: ["citação", "depoimento", "frase", "destaque"],
  create: () => ({
    content: { text: "Aprender é a única coisa de que a mente nunca se cansa.", author: "Leonardo da Vinci", role: "" },
    settings: { style: "classic" },
  }),
};

/* ---------------------------------------------------------------- Divisor */
export interface DividerContent { label: string }
export interface DividerSettings { style: "line" | "dots" | "space" }
export const dividerBlock: BlockDefinition<DividerContent, DividerSettings> = {
  type: "divider",
  version: 1,
  category: "content",
  name: "Divisor",
  description: "Separa seções com linha, pontos ou espaço.",
  keywords: ["divisor", "separador", "linha", "espaço"],
  create: () => ({ content: { label: "" }, settings: { style: "line" }, style: { padding: "s" } }),
};

/* ---------------------------------------------------------------- Colunas */
export interface ColumnItem { id: string; title: string; html: string; media: MediaRef | null }
export interface ColumnsContent { columns: ColumnItem[] }
export interface ColumnsSettings { count: 2 | 3; card: boolean; showImages: boolean }
const column = (n: number): ColumnItem => ({
  id: uid("c"),
  title: `Coluna ${n}`,
  html: "<p>Conteúdo da coluna.</p>",
  media: null,
});
export const columnsBlock: BlockDefinition<ColumnsContent, ColumnsSettings> = {
  type: "columns",
  version: 1,
  category: "layout",
  name: "Colunas",
  description: "Conteúdo lado a lado em duas ou três colunas.",
  keywords: ["colunas", "duas colunas", "três colunas", "cards", "comparação"],
  create: () => ({
    content: { columns: [column(1), column(2), column(3)] },
    settings: { count: 2, card: true, showImages: false },
  }),
};
