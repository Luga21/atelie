"use client";
import { memo, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, Copy, GripVertical, SlidersHorizontal, Trash2 } from "lucide-react";
import { BlockRenderer } from "@/blocks/BlockRenderer";
import { BLOCK_EDITOR_KITS } from "@/blocks/editorKit";
import { getBlockDefinition } from "@/blocks/engine/registry";
import type { BlockUpdater } from "@/blocks/engine/context";
import type { Block } from "@/core/model/types";
import { cn } from "@/ui/cn";
import { useEditor } from "../state/editorStore";

const ToolBtn = ({ label, onClick, children, disabled, danger }: { label: string; onClick: () => void; children: React.ReactNode; disabled?: boolean; danger?: boolean }) => (
  <button type="button" aria-label={label} title={label} disabled={disabled}
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={cn("grid h-8 w-8 place-items-center rounded-md text-ink-200 transition-colors disabled:opacity-30",
      danger ? "hover:bg-red-500/20 hover:text-red-300" : "hover:bg-ink-700 hover:text-white")}>
    {children}
  </button>
);

/** Moldura de edição de um bloco no canvas: seleção, barra de ações e alça de arraste. */
export const BlockShell = memo(function BlockShell({ block, index, total, lessonId, selected }: {
  block: Block;
  index: number;
  total: number;
  lessonId: string;
  selected: boolean;
}) {
  const sortable = useSortable({ id: block.id, data: { type: "block" } });
  const st = useEditor.getState();
  const def = getBlockDefinition(block.type);
  const kit = BLOCK_EDITOR_KITS[block.type];

  const update = useCallback<BlockUpdater<any, any>>(
    (recipe, key) => useEditor.getState().updateBlock(block.id, recipe as any, key),
    [block.id],
  );

  return (
    <div
      ref={sortable.setNodeRef}
      style={{ transform: CSS.Translate.toString(sortable.transform), transition: sortable.transition }}
      className={cn("group/block relative [&>.chrome]:font-sans [&>.chrome]:leading-normal", sortable.isDragging && "z-10 opacity-50")}
      onMouseDown={() => !selected && st.selectBlock(block.id)}
      data-block-id={block.id}
    >
      {/* contorno de hover/seleção */}
      <div className={cn("pointer-events-none absolute inset-0 z-[5] transition-shadow",
        selected ? "shadow-[inset_0_0_0_2px_var(--color-brand-500)]" : "group-hover/block:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-brand-500)_55%,transparent)]")} />

      {/* rótulo do tipo */}
      <div className={cn("chrome absolute left-3 -top-3 z-20 flex items-center gap-1.5 rounded-md bg-ink-900/95 px-2 py-1 text-[11px] font-medium text-ink-200 shadow-lg transition-opacity [&_svg]:size-3",
        selected ? "opacity-100" : "opacity-0 group-hover/block:opacity-100")}>
        <span style={{ color: kit?.tint }}>{kit?.icon}</span>
        {def?.name ?? block.type}
      </div>

      {/* barra de ações */}
      <div className={cn("chrome absolute right-3 -top-[18px] z-20 flex items-center gap-0.5 rounded-lg border border-ink-700 bg-ink-900/95 p-0.5 shadow-xl shadow-black/30 backdrop-blur transition-opacity",
        selected ? "opacity-100" : "pointer-events-none opacity-0 group-hover/block:pointer-events-auto group-hover/block:opacity-100")}
        onMouseDown={(e) => e.stopPropagation()}>
        <button type="button" {...sortable.attributes} {...sortable.listeners} aria-label="Arrastar para reordenar" title="Arrastar para reordenar"
          className="grid h-8 w-8 cursor-grab place-items-center rounded-md text-ink-300 hover:bg-ink-700 hover:text-white active:cursor-grabbing">
          <GripVertical size={16} />
        </button>
        <ToolBtn label="Mover para cima" disabled={index === 0} onClick={() => st.moveBlock(lessonId, index, index - 1)}><ArrowUp size={15} /></ToolBtn>
        <ToolBtn label="Mover para baixo" disabled={index === total - 1} onClick={() => st.moveBlock(lessonId, index, index + 1)}><ArrowDown size={15} /></ToolBtn>
        <ToolBtn label="Configurações (painel)" onClick={() => { st.selectBlock(block.id); st.setPanel("block"); }}><SlidersHorizontal size={15} /></ToolBtn>
        <ToolBtn label="Duplicar (Ctrl+D)" onClick={() => st.duplicateBlock(block.id)}><Copy size={15} /></ToolBtn>
        <ToolBtn label="Excluir (Delete)" danger onClick={() => st.removeBlock(block.id)}><Trash2 size={15} /></ToolBtn>
      </div>

      <BlockRenderer block={block} mode="edit" update={update} />
    </div>
  );
});
