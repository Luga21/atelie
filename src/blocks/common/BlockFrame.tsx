import type { ReactNode } from "react";
import type { BlockStyle } from "@/core/model/types";

/**
 * Moldura comum de todos os blocos: aplica fundo, espaçamento e largura a partir
 * de tokens do tema. Usada igualmente pelo canvas e pelo player.
 */
export function BlockFrame({ type, style, children }: { type: string; style: BlockStyle; children: ReactNode }) {
  return (
    <section className={`cr-block cr-block--${type}`} data-bg={style.background} data-pad={style.padding} data-width={style.width}>
      <div className="cr-block-inner">{children}</div>
    </section>
  );
}
