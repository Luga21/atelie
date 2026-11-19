"use client";
import { useCallback, useMemo, useState } from "react";
import { Copy, Trash2 } from "lucide-react";
import { BLOCK_EDITOR_KITS } from "@/blocks/editorKit";
import { Field, Section, Segmented } from "@/blocks/editor-ui/fields";
import type { BlockUpdater } from "@/blocks/engine/context";
import { getBlockDefinition } from "@/blocks/engine/registry";
import { findBlock } from "@/core/model/operations";
import type { BlockStyle } from "@/core/model/types";
import { cn } from "@/ui/cn";
import { IconButton } from "@/ui/primitives";
import { useEditor } from "../state/editorStore";
import { PanelHeader } from "./RightPanel";

const BACKGROUNDS: { value: BlockStyle["background"]; label: string; swatch: string }[] = [
  { value: "none", label: "Nenhum", swatch: "var(--c-bg, #fff)" },
  { value: "surface", label: "Superfície", swatch: "var(--c-surface)" },
  { value: "tint", label: "Suave", swatch: "color-mix(in srgb, var(--c-primary) 18%, white)" },
  { value: "primary", label: "Primária", swatch: "var(--c-primary)" },
  { value: "dark", label: "Escuro", swatch: "var(--c-dark)" },
];

export function BlockPanel({ blockId }: { blockId: string }) {
  const course = useEditor((s) => s.course)!;
  const block = useMemo(() => findBlock(course, blockId)?.block, [course, blockId]);
  const [tab, setTab] = useState<"content" | "style">("content");
  const st = useEditor.getState();
  const update = useCallback<BlockUpdater<any, any>>((recipe, key) => st.updateBlock(blockId, recipe as any, key), [blockId, st]);

  if (!block) return null;
  const def = getBlockDefinition(block.type);
  const kit = BLOCK_EDITOR_KITS[block.type];
  const Inspector = kit?.Inspector;
  const setStyle = <K extends keyof BlockStyle>(k: K, v: BlockStyle[K]) => update((d) => { d.style[k] = v; });

  // Variáveis do tema para as amostras de cor do painel.
  const c = course.theme.colors;
  const swatchVars = { "--c-bg": c.background, "--c-surface": c.surface, "--c-primary": c.primary, "--c-dark": c.secondary } as React.CSSProperties;

  return (
    <>
      <PanelHeader
        icon={<span style={{ color: kit?.tint }} className="[&>svg]:size-4">{kit?.icon}</span>}
        title={def?.name ?? block.type}
        subtitle={def?.description}
        onClose={() => st.selectBlock(null)}
        actions={
          <div className="flex">
            <IconButton label="Duplicar bloco" size="sm" onClick={() => st.duplicateBlock(block.id)}><Copy size={14} /></IconButton>
            <IconButton label="Excluir bloco" size="sm" onClick={() => st.removeBlock(block.id)}><Trash2 size={14} /></IconButton>
          </div>
        }
      />
      <div className="flex gap-1 border-b border-ink-800 px-3 py-2" role="tablist">
        {(["content", "style"] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={cn("h-7 flex-1 rounded-md text-[12px] font-medium transition-colors", tab === t ? "bg-ink-800 text-white" : "text-ink-400 hover:text-ink-100")}>
            {t === "content" ? "Configurações" : "Estilo"}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin" key={block.id}>
        {tab === "content" ? (
          Inspector ? <Inspector block={block} update={update} /> : <p className="p-4 text-[12px] text-ink-500">Este bloco não possui configurações adicionais.</p>
        ) : (
          <>
            <Section title="Fundo">
              <div className="grid grid-cols-5 gap-1.5" style={swatchVars}>
                {BACKGROUNDS.map((b) => (
                  <button key={b.value} type="button" onClick={() => setStyle("background", b.value)} title={b.label} aria-pressed={block.style.background === b.value}
                    className={cn("flex flex-col items-center gap-1 rounded-lg p-1 text-[10px] text-ink-400 transition-colors hover:bg-ink-800",
                      block.style.background === b.value && "bg-ink-800 text-white")}>
                    <span className={cn("h-8 w-full rounded-md border", block.style.background === b.value ? "border-brand-400 ring-2 ring-brand-500/40" : "border-ink-600")} style={{ background: b.swatch }} />
                    {b.label}
                  </button>
                ))}
              </div>
            </Section>
            <Section title="Espaçamento e largura">
              <Field label="Espaçamento vertical">
                <Segmented value={block.style.padding} onChange={(v) => setStyle("padding", v)}
                  options={[{ value: "none", label: "0" }, { value: "s", label: "P" }, { value: "m", label: "M" }, { value: "l", label: "G" }, { value: "xl", label: "GG" }]} />
              </Field>
              <Field label="Largura do conteúdo">
                <Segmented value={block.style.width} onChange={(v) => setStyle("width", v)}
                  options={[{ value: "narrow", label: "Estreita" }, { value: "normal", label: "Normal" }, { value: "wide", label: "Larga" }, { value: "full", label: "Total" }]} />
              </Field>
              <p className="text-[11px] leading-relaxed text-ink-500">Cores, fontes e arredondamentos vêm do tema do treinamento, garantindo consistência entre todos os blocos.</p>
            </Section>
          </>
        )}
      </div>
    </>
  );
}
