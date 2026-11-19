import "@/blocks/definitions";
import { normalizeBlock } from "@/blocks/engine/registry";
import { defaultTheme } from "../theme/presets";
import type { Theme } from "../theme/types";
import { uid } from "./ids";
import { COURSE_SCHEMA_VERSION, type Course, type CourseSummary, type MediaRef } from "./types";

export class CourseFormatError extends Error {}

/** Migrações de esquema do documento: índice N converte a versão N para N+1. */
const COURSE_MIGRATIONS: Array<(raw: any) => any> = [];

function mergeTheme(raw: Partial<Theme> | undefined): Theme {
  const d = defaultTheme();
  if (!raw || typeof raw !== "object") return d;
  return {
    presetId: raw.presetId ?? null,
    colors: { ...d.colors, ...raw.colors },
    typography: { ...d.typography, ...raw.typography },
    components: { ...d.components, ...raw.components },
    layout: { ...d.layout, ...raw.layout },
  };
}

/**
 * Valida, migra e normaliza qualquer documento de curso (armazenado ou importado).
 * Todo dado que entra na aplicação passa por aqui.
 */
export function normalizeCourse(input: unknown): Course {
  if (!input || typeof input !== "object") throw new CourseFormatError("Documento de treinamento inválido.");
  let raw: any = input;
  let v = typeof raw.schemaVersion === "number" ? raw.schemaVersion : 1;
  if (v > COURSE_SCHEMA_VERSION) {
    throw new CourseFormatError("Este treinamento foi criado em uma versão mais nova da ferramenta.");
  }
  while (v < COURSE_SCHEMA_VERSION) {
    raw = COURSE_MIGRATIONS[v - 1](raw);
    v++;
  }
  if (!Array.isArray(raw.modules)) throw new CourseFormatError("O treinamento não possui módulos válidos.");
  const now = Date.now();
  return {
    schemaVersion: COURSE_SCHEMA_VERSION,
    id: String(raw.id || uid("c")),
    title: String(raw.title ?? "Treinamento sem título"),
    description: String(raw.description ?? ""),
    cover: {
      image: raw.cover?.image ?? null,
      eyebrow: String(raw.cover?.eyebrow ?? ""),
      buttonLabel: String(raw.cover?.buttonLabel ?? "Começar"),
      showOutline: raw.cover?.showOutline !== false,
    },
    theme: mergeTheme(raw.theme),
    lms: {
      passingScore: Math.min(100, Math.max(0, Number(raw.lms?.passingScore ?? 70) || 0)),
      identifier: typeof raw.lms?.identifier === "string" && raw.lms.identifier ? raw.lms.identifier : `pkg_${String(raw.id || uid("c")).replace(/^c_/, "")}`,
    },
    status: ["draft", "review", "published"].includes(raw.status) ? raw.status : "draft",
    folderId: raw.folderId ?? null,
    createdAt: Number(raw.createdAt) || now,
    updatedAt: Number(raw.updatedAt) || now,
    modules: raw.modules.map((m: any) => ({
      id: String(m?.id || uid("m")),
      title: String(m?.title ?? "Módulo"),
      lessons: (Array.isArray(m?.lessons) ? m.lessons : []).map((l: any) => ({
        id: String(l?.id || uid("l")),
        title: String(l?.title ?? "Aula"),
        blocks: (Array.isArray(l?.blocks) ? l.blocks : [])
          .filter((b: any) => b && typeof b.type === "string")
          .map((b: any) => normalizeBlock(b)),
      })),
    })),
  };
}

export function summarizeCourse(course: Course): CourseSummary {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    cover: course.cover.image,
    status: course.status,
    folderId: course.folderId,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    moduleCount: course.modules.length,
    lessonCount: course.modules.reduce((n, m) => n + m.lessons.length, 0),
    primaryColor: course.theme.colors.primary,
  };
}

/* ---------------------------------------------------------------- Mídias */

function isAssetRef(v: any): v is Extract<MediaRef, { kind: "asset" }> {
  return v && typeof v === "object" && v.kind === "asset" && typeof v.id === "string";
}

/** Percorre o documento inteiro (genérico para qualquer tipo de bloco) coletando ids de assets. */
export function collectAssetIds(value: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => collectAssetIds(v, out));
  else if (value && typeof value === "object") {
    if (isAssetRef(value)) out.add(value.id);
    else Object.values(value).forEach((v) => collectAssetIds(v, out));
  }
  return out;
}

/** Retorna uma cópia do valor com ids de assets substituídos conforme o mapa. */
export function remapAssetIds<T>(value: T, map: Map<string, string>): T {
  if (Array.isArray(value)) return value.map((v) => remapAssetIds(v, map)) as T;
  if (value && typeof value === "object") {
    if (isAssetRef(value)) return { kind: "asset", id: map.get(value.id) ?? value.id } as T;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = remapAssetIds(v, map);
    return out as T;
  }
  return value;
}
