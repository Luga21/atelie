"use client";
import { memo } from "react";
import type { Block } from "@/core/model/types";
import { BlockFrame } from "./common/BlockFrame";
import type { BlockUpdater, RenderMode } from "./engine/context";
import { BLOCK_VIEWS } from "./views";

interface Props {
  block: Block;
  mode: RenderMode;
  update?: BlockUpdater<any, any>;
}

/** Renderiza qualquer bloco a partir do registro. Usado pelo canvas e pelo player. */
export const BlockRenderer = memo(function BlockRenderer({ block, mode, update }: Props) {
  const View = BLOCK_VIEWS[block.type];
  return (
    <BlockFrame type={block.type} style={block.style}>
      {View ? (
        <View block={block} mode={mode} update={update} />
      ) : (
        <div className="cr-unknown">Este bloco ({block.type}) não é suportado nesta versão.</div>
      )}
    </BlockFrame>
  );
});
