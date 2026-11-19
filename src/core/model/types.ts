/**
 * Modelo de dados do treinamento.
 *
 * Hierarquia: Course → Module → Lesson → Block.
 * Este arquivo é a fonte de verdade compartilhada por editor, canvas, player, storage e export.
 * Nada aqui depende de React ou do navegador.
 */
import type { Theme } from "../theme/types";

export type ID = string;

/** Versão do esquema do documento. Incrementar ao mudar a estrutura e adicionar migração em schema.ts. */
export const COURSE_SCHEMA_VERSION = 1;

export type CourseStatus = "draft" | "review" | "published";

/** Referência a uma mídia: arquivo local (IndexedDB) ou URL externa. */
export type MediaRef = { kind: "asset"; id: ID } | { kind: "url"; url: string };

export interface CoverSettings {
  image: MediaRef | null;
  /** Texto curto acima do título (ex.: "Onboarding · 2026"). */
  eyebrow: string;
  buttonLabel: string;
  showOutline: boolean;
}

/** Configurações de rastreamento em LMS (SCORM). */
export interface LmsSettings {
  /** Nota mínima (0–100) para "aprovado". Usada apenas se o curso tiver atividades com nota. */
  passingScore: number;
  /** Identificador estável do pacote no LMS (mantido entre exportações para o LMS reconhecer atualizações). */
  identifier: string;
}

export interface Course {
  schemaVersion: number;
  id: ID;
  title: string;
  description: string;
  cover: CoverSettings;
  theme: Theme;
  lms: LmsSettings;
  modules: Module[];
  status: CourseStatus;
  folderId: ID | null;
  createdAt: number;
  updatedAt: number;
}

export interface Module {
  id: ID;
  title: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: ID;
  title: string;
  blocks: Block[];
}

/** Estilo visual comum a todos os blocos. Valores são tokens do tema, nunca cores/medidas livres. */
export interface BlockStyle {
  background: "none" | "surface" | "tint" | "primary" | "dark";
  padding: "none" | "s" | "m" | "l" | "xl";
  width: "narrow" | "normal" | "wide" | "full";
}

/**
 * Bloco de conteúdo.
 * - `content`: dados de conteúdo (textos, itens, mídias).
 * - `settings`: configurações específicas do tipo (visuais e de comportamento).
 * - `style`: configurações visuais comuns (fundo, espaçamento, largura).
 * - `version`: versão da definição do bloco que gerou estes dados (usada nas migrações).
 */
export interface Block<C = unknown, S = unknown> {
  id: ID;
  type: string;
  version: number;
  content: C;
  settings: S;
  style: BlockStyle;
}

export interface Folder {
  id: ID;
  name: string;
  createdAt: number;
}

/** Resumo leve do curso usado pelo dashboard (evita carregar o documento inteiro). */
export interface CourseSummary {
  id: ID;
  title: string;
  description: string;
  cover: MediaRef | null;
  status: CourseStatus;
  folderId: ID | null;
  createdAt: number;
  updatedAt: number;
  moduleCount: number;
  lessonCount: number;
  primaryColor: string;
}

export interface StoredAsset {
  id: ID;
  courseId: ID;
  name: string;
  mime: string;
  size: number;
  blob: Blob;
  createdAt: number;
}

export const STATUS_LABEL: Record<CourseStatus, string> = {
  draft: "Rascunho",
  review: "Em revisão",
  published: "Publicado",
};
