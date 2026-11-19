"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import "@/blocks/definitions";
import { BLOCK_CATEGORIES, type BlockCategoryId } from "@/blocks/engine/definition";
import { listBlockDefinitions } from "@/blocks/engine/registry";
import { BLOCK_EDITOR_KITS } from "@/blocks/editorKit";
import { cn } from "@/ui/cn";

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Biblioteca de blocos exibida no próprio fluxo do canvas (sem modal). */
export function BlockLibrary({ onPick, onClose, title = "Adicionar bloco" }: { onPick: (type: string) => void; onClose?: () => void; title?: string }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<BlockCategoryId | "all">("all");
  const [hover, setHover] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
    rootRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  const defs = listBlockDefinitions();
  const results = useMemo(() => {
    const q = normalize(query.trim());
    return defs.filter(
      (d) =>
        (cat === "all" || d.category === cat) &&
        (!q || normalize([d.name, d.description, ...d.keywords].join(" ")).includes(q)),
    );
  }, [defs, query, cat]);

  const categories = BLOCK_CATEGORIES.filter((c) => defs.some((d) => d.category === c.id));
  const grouped = categories
    .map((c) => ({ ...c, items: results.filter((d) => d.category === c.id) }))
    .filter((g) => g.items.length);

  return (
    <div ref={rootRef} className="relative z-20 mx-auto my-3 w-full font-sans leading-normal max-w-[860px] overflow-hidden rounded-2xl border border-ink-700 bg-ink-900 text-ink-100 shadow-2xl shadow-black/50 animate-pop"
      onMouseDown={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-3 border-b border-ink-800 px-4 py-3">
        <span className="text-[13px] font-semibold text-white">{title}</span>
        <div className="relative ml-2 flex-1">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) onPick(results[0].type);
              if (e.key === "Escape") onClose?.();
            }}
            placeholder="Buscar componentes… (ex.: quiz, imagem, abas)"
            aria-label="Buscar componentes"
            className="h-8 w-full rounded-lg border border-ink-700 bg-ink-950 pl-8 pr-3 text-[13px] outline-none placeholder:text-ink-500 focus:border-brand-500"
          />
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Fechar biblioteca" className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-800 hover:text-white">
            <X size={16} />
          </button>
        )}
      </div>
      <div className="flex gap-1 overflow-x-auto border-b border-ink-800 px-3 py-2 scroll-thin" role="tablist">
        {[{ id: "all" as const, label: "Todos" }, ...categories].map((c) => (
          <button key={c.id} type="button" role="tab" aria-selected={cat === c.id} onClick={() => setCat(c.id)}
            className={cn("h-7 shrink-0 rounded-full px-3 text-[12px] font-medium transition-colors",
              cat === c.id ? "bg-ink-700 text-white" : "text-ink-400 hover:text-white")}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="max-h-[420px] overflow-y-auto p-3 scroll-thin">
        {grouped.length === 0 && <p className="py-10 text-center text-[13px] text-ink-500">Nenhum componente encontrado para “{query}”.</p>}
        {grouped.map((g) => (
          <div key={g.id} className="mb-3 last:mb-0">
            <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-ink-500">{g.label}</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {g.items.map((d) => {
                const kit = BLOCK_EDITOR_KITS[d.type];
                return (
                  <button key={d.type} type="button" onClick={() => onPick(d.type)} onMouseEnter={() => setHover(d.type)} onMouseLeave={() => setHover(null)}
                    className="group flex flex-col overflow-hidden rounded-xl border border-ink-800 bg-ink-850 text-left transition-all hover:-translate-y-0.5 hover:border-ink-600 hover:bg-ink-800 focus-visible:outline-2 focus-visible:outline-brand-400">
                    <div className="aspect-[5/3] w-full bg-ink-900 p-2">{kit && <kit.Thumb />}</div>
                    <div className="flex items-center gap-2 px-2.5 pb-1 pt-2">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md [&>svg]:size-3.5" style={{ background: `${kit?.tint}26`, color: kit?.tint }}>{kit?.icon}</span>
                      <span className="truncate text-[12.5px] font-medium text-ink-100">{d.name}</span>
                    </div>
                    <p className={cn("px-2.5 pb-2.5 text-[11px] leading-snug text-ink-500 line-clamp-2 transition-colors", hover === d.type && "text-ink-300")}>{d.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
