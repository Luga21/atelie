"use client";
/** Campos reutilizáveis dos painéis de propriedades dos blocos (somente editor). */
import { useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Copy, ImageIcon, Link2, Plus, Trash2, Upload, X } from "lucide-react";
import type { MediaRef } from "@/core/model/types";
import { cn } from "@/ui/cn";
import { IconButton, Input, Segmented, Select, Switch, Textarea } from "@/ui/primitives";
import { useEditorServices, useMediaUrl } from "../engine/context";

export { Segmented, Select, Switch };

export function Section({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-ink-800 last:border-0">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-4 py-3 text-[13px] font-semibold text-ink-100 hover:text-white">
        {title}
        <ChevronDown size={15} className={cn("text-ink-500 transition-transform", !open && "-rotate-90")} />
      </button>
      {open && <div className="space-y-3.5 px-4 pb-4">{children}</div>}
    </section>
  );
}

export function Field({ label, hint, children, inline }: { label: string; hint?: string; children: ReactNode; inline?: boolean }) {
  return (
    <div className={cn(inline && "flex items-center justify-between gap-3")}>
      <div className={cn(!inline && "mb-1.5")}>
        <span className="text-[12px] font-medium text-ink-300">{label}</span>
        {hint && <p className="text-[11px] leading-snug text-ink-500">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export function ToggleField({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Field label={label} hint={hint} inline>
      <Switch checked={checked} onChange={onChange} label={label} />
    </Field>
  );
}

export function TextField({ label, value, onChange, placeholder, multiline, hint }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      {multiline ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </Field>
  );
}

/** Seleção de mídia: upload (IndexedDB), URL externa ou remoção. */
export function MediaField({ label, value, onChange, kind = "image" }: {
  label: string;
  value: MediaRef | null;
  onChange: (v: MediaRef | null) => void;
  kind?: "image" | "video" | "audio";
}) {
  const services = useEditorServices();
  const url = useMediaUrl(value);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState(value?.kind === "url" ? value.url : "");

  const upload = async (file?: File) => {
    if (!file || !services) return;
    setError(null);
    if (!file.type.startsWith(`${kind}/`)) {
      setError({ image: "Selecione um arquivo de imagem.", video: "Selecione um arquivo de vídeo.", audio: "Selecione um arquivo de áudio." }[kind]);
      return;
    }
    setBusy(true);
    try {
      onChange(await services.uploadMedia(file));
      setUrlDraft("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <Field label={label}>
      <div className="overflow-hidden rounded-lg border border-ink-700 bg-ink-900">
        {url && kind === "image" ? (
          <div className="group relative">
            <img src={url} alt="" className="h-32 w-full object-cover" />
            <button type="button" onClick={() => onChange(null)} aria-label="Remover imagem"
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100">
              <X size={14} />
            </button>
          </div>
        ) : value ? (
          <div className="flex items-center gap-2 px-3 py-2.5 text-[12px] text-ink-300">
            <span className="flex-1 truncate">{value.kind === "url" ? value.url : "Arquivo enviado"}</span>
            <IconButton label="Remover" size="sm" onClick={() => { onChange(null); setUrlDraft(""); }}><X size={14} /></IconButton>
          </div>
        ) : (
          <div className="grid h-20 place-items-center text-ink-500"><ImageIcon size={20} /></div>
        )}
        <div className="flex gap-1.5 border-t border-ink-700 p-1.5">
          <button type="button" disabled={busy} onClick={() => input.current?.click()}
            className="inline-flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md bg-ink-800 text-[12px] font-medium text-ink-100 hover:bg-ink-750">
            <Upload size={13} /> {busy ? "Enviando…" : "Enviar arquivo"}
          </button>
        </div>
        <input ref={input} type="file" accept={`${kind}/*`} hidden onChange={(e) => upload(e.target.files?.[0])} />
      </div>
      <form className="mt-1.5 flex gap-1.5" onSubmit={(e) => {
        e.preventDefault();
        if (urlDraft.trim()) onChange({ kind: "url", url: urlDraft.trim() });
      }}>
        <div className="relative flex-1">
          <Link2 size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-500" />
          <Input className="h-8 pl-7 text-[12px]" value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)}
            placeholder={{ video: "URL do YouTube, Vimeo ou .mp4", audio: "ou cole a URL de um .mp3", image: "ou cole a URL de uma imagem" }[kind]} />
        </div>
        <button type="submit" className="h-8 rounded-md bg-ink-800 px-2.5 text-[12px] font-medium text-ink-100 hover:bg-ink-750">Usar</button>
      </form>
      {error && <p className="mt-1 text-[11px] text-red-300">{error}</p>}
    </Field>
  );
}

/** Editor genérico de listas de itens (abas, cards, etapas, alternativas…). */
export function ItemsField<T extends { id: string }>({ label, items, getTitle, renderItem, onAdd, onRemove, onMove, onDuplicate, min = 1, addLabel = "Adicionar item", canAdd = true }: {
  canAdd?: boolean;
  label: string;
  items: T[];
  getTitle: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onMove: (from: number, to: number) => void;
  onDuplicate?: (index: number) => void;
  min?: number;
  addLabel?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[12px] font-medium text-ink-300">{label}</span>
        <span className="text-[11px] text-ink-500">{items.length}</span>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => {
          const open = openId === item.id;
          return (
            <li key={item.id} className={cn("rounded-lg border bg-ink-900 transition-colors", open ? "border-ink-600" : "border-ink-700")}>
              <div className="flex items-center gap-1 pl-2.5 pr-1">
                <button type="button" onClick={() => setOpenId(open ? null : item.id)} className="flex h-9 min-w-0 flex-1 items-center gap-2 text-left text-[12.5px] text-ink-100">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-ink-800 text-[10px] font-semibold text-ink-400">{i + 1}</span>
                  <span className="truncate">{getTitle(item, i) || "Sem título"}</span>
                </button>
                <IconButton label="Mover para cima" size="sm" disabled={i === 0} onClick={() => onMove(i, i - 1)}><ChevronUp size={14} /></IconButton>
                <IconButton label="Mover para baixo" size="sm" disabled={i === items.length - 1} onClick={() => onMove(i, i + 1)}><ChevronDown size={14} /></IconButton>
                {onDuplicate && <IconButton label="Duplicar" size="sm" onClick={() => onDuplicate(i)}><Copy size={13} /></IconButton>}
                <IconButton label="Remover" size="sm" disabled={items.length <= min} onClick={() => onRemove(i)}><Trash2 size={13} /></IconButton>
              </div>
              {open && <div className="space-y-3 border-t border-ink-800 p-2.5">{renderItem(item, i)}</div>}
            </li>
          );
        })}
      </ul>
      {canAdd && <button type="button" onClick={onAdd} className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink-600 text-[12px] font-medium text-ink-300 hover:border-brand-500 hover:text-brand-300">
        <Plus size={14} /> {addLabel}
      </button>}
    </div>
  );
}

export function moveItem<T>(arr: T[], from: number, to: number) {
  if (to < 0 || to >= arr.length) return;
  const [it] = arr.splice(from, 1);
  arr.splice(to, 0, it);
}
