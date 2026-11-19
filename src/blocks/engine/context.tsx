"use client";
/**
 * Contextos de renderização compartilhados entre canvas do editor, preview e player exportado.
 * Os blocos dependem apenas destas interfaces — nunca do editor, do storage ou do Next.js.
 */
import { createContext, useContext, useEffect, useState, type ComponentType } from "react";
import type { Block, MediaRef } from "@/core/model/types";

export type RenderMode = "edit" | "view";

export type BlockUpdater<C, S> = (recipe: (draft: Block<C, S>) => void, coalesceKey?: string) => void;

export interface BlockViewProps<C = any, S = any> {
  block: Block<C, S>;
  mode: RenderMode;
  /** Disponível apenas no canvas do editor (mode="edit"). */
  update?: BlockUpdater<C, S>;
}

export type BlockView<C = any, S = any> = ComponentType<BlockViewProps<C, S>>;

/* --------------------------------------------------------------- Mídias */

/** Resolve referências de mídia em URLs. Cada ambiente fornece sua implementação. */
export interface MediaResolver {
  /** URL disponível de forma síncrona (cache ou caminho estático), se houver. */
  peek(id: string): string | null;
  /** Carrega a URL de um asset (ex.: blob do IndexedDB). */
  load(id: string): Promise<string | null>;
}

const nullResolver: MediaResolver = { peek: () => null, load: async () => null };
export const MediaResolverContext = createContext<MediaResolver>(nullResolver);

export function useMediaUrl(ref: MediaRef | null | undefined): string | null {
  const resolver = useContext(MediaResolverContext);
  const assetId = ref?.kind === "asset" ? ref.id : null;
  const [loaded, setLoaded] = useState<{ id: string; url: string | null } | null>(null);
  useEffect(() => {
    if (!assetId || resolver.peek(assetId)) return;
    let alive = true;
    resolver.load(assetId).then((url) => alive && setLoaded({ id: assetId, url }));
    return () => {
      alive = false;
    };
  }, [assetId, resolver]);
  if (!ref) return null;
  if (ref.kind === "url") return ref.url || null;
  return resolver.peek(ref.id) ?? (loaded?.id === ref.id ? loaded.url : null);
}

/* ------------------------------------------------- Serviços do editor */

/** Serviços que só existem no editor (upload). Nulo no player. */
export interface EditorServices {
  uploadMedia(file: File): Promise<MediaRef>;
  selectBlock(blockId: string): void;
}
export const EditorServicesContext = createContext<EditorServices | null>(null);
export const useEditorServices = () => useContext(EditorServicesContext);

/* --------------------------------------------- Resultados de atividades */

export interface ActivityResult {
  score: number;
  maxScore: number;
  passed: boolean;
  attempts: number;
  /** Ids escolhidos na última tentativa, para restaurar o estado. */
  response: string[];
  completed: boolean;
}

/** Recebe resultados das atividades. Implementado pelo player (progresso local, futuramente SCORM). */
export interface ActivityReporter {
  get(blockId: string): ActivityResult | undefined;
  report(blockId: string, result: ActivityResult): void;
}
export const ActivityReporterContext = createContext<ActivityReporter | null>(null);
export const useActivityReporter = () => useContext(ActivityReporterContext);

/* ------------------------------------------- Escopo da aula (só player) */

/**
 * Informações da aula em exibição, para blocos que dependem do contexto
 * (ex.: feedback de desempenho, etapas com desbloqueio).
 */
export interface LessonScope {
  /** Ids dos blocos avaliativos da aula atual e do treinamento inteiro, em ordem. */
  lessonActivityIds: string[];
  courseActivityIds: string[];
  /** Ids dos blocos avaliativos da aula que aparecem antes do bloco informado. */
  activitiesBefore(blockId: string): string[];
  /** Etapas com desbloqueio já liberadas. */
  isUnlocked(blockId: string): boolean;
  unlock(blockId: string): void;
}
export const LessonScopeContext = createContext<LessonScope | null>(null);
export const useLessonScope = () => useContext(LessonScopeContext);
