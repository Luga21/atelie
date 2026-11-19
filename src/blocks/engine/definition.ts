/**
 * Contrato central do motor de blocos (parte "pura", sem React).
 *
 * Um tipo de bloco é composto por três partes registradas separadamente:
 *  1. BlockDefinition (este arquivo)  → metadados, valores padrão, migração, pontuação.
 *  2. BlockView (blocks/views.ts)     → renderização no canvas (mode="edit") e no player (mode="view").
 *  3. BlockEditorKit (blocks/editorKit.tsx) → painel de propriedades, ícone e prévia na biblioteca.
 *
 * A separação permite que o player exportado inclua apenas (1) e (2), sem nenhum código do editor.
 */
import type { BlockStyle } from "@/core/model/types";

export type BlockCategoryId = "content" | "interactive" | "activity" | "layout" | "experience";

export const BLOCK_CATEGORIES: { id: BlockCategoryId; label: string; description: string }[] = [
  { id: "content", label: "Conteúdo", description: "Textos, mídias e elementos de leitura" },
  { id: "interactive", label: "Interatividade", description: "Conteúdo que o aluno explora" },
  { id: "activity", label: "Atividades", description: "Perguntas com correção e feedback" },
  { id: "layout", label: "Estrutura", description: "Colunas, tabelas e organização visual" },
  { id: "experience", label: "Experiências", description: "Cenários, desbloqueios e desempenho" },
];

export interface BlockData<C, S> {
  content: C;
  settings: S;
}

export interface BlockDefinition<C = any, S = any> {
  /** Identificador estável do tipo. Nunca renomear: está gravado nos treinamentos. */
  type: string;
  /** Versão do formato de dados. Incrementar ao mudar content/settings e implementar `migrate`. */
  version: number;
  category: BlockCategoryId;
  name: string;
  description: string;
  keywords: string[];
  /** Conteúdo e configurações iniciais ao inserir o bloco. */
  create(): BlockData<C, S> & { style?: Partial<BlockStyle> };
  /** Converte dados de versões anteriores para a versão atual. */
  migrate?(data: BlockData<any, any>, fromVersion: number): BlockData<C, S>;
  /**
   * Presente em blocos que o aluno "responde" (entram no progresso e no feedback de desempenho).
   * `maxScore` 0 = atividade sem nota (ex.: pergunta aberta), contada apenas como concluída.
   */
  scoring?: { maxScore(data: BlockData<C, S>): number };
}

export const DEFAULT_BLOCK_STYLE: BlockStyle = { background: "none", padding: "m", width: "normal" };
