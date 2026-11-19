import type { ComponentType, ReactNode } from "react";
import type { Block } from "@/core/model/types";
import type { BlockUpdater } from "../engine/context";

export interface BlockInspectorProps<C = any, S = any> {
  block: Block<C, S>;
  update: BlockUpdater<C, S>;
}

/** Parte do bloco usada apenas pelo editor: painel de propriedades, ícone e prévia na biblioteca. */
export interface BlockEditorKit {
  Inspector?: ComponentType<BlockInspectorProps>;
  icon: ReactNode;
  /** Cor do ícone na biblioteca/estrutura. */
  tint: string;
  Thumb: ComponentType;
}
