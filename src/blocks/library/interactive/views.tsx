"use client";
import { useEffect, useId, useState } from "react";
import { uid } from "@/core/model/ids";
import { EditableText, RichText } from "../../common/Editable";
import { MediaImage } from "../../common/Media";
import type { BlockViewProps } from "../../engine/context";
import type {
  AccordionContent, AccordionSettings, FlashcardsContent, FlashcardsSettings, ProcessContent, ProcessSettings,
  TabsContent, TabsSettings,
} from "./definitions";

const Chevron = ({ open }: { open: boolean }) => (
  <svg className={`cr-chevron ${open ? "is-open" : ""}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

/* -------------------------------------------------------------- Acordeão */
export function AccordionView({ block, mode, update }: BlockViewProps<AccordionContent, AccordionSettings>) {
  const { items } = block.content;
  const s = block.settings;
  const edit = mode === "edit";
  const baseId = useId();
  const [open, setOpen] = useState<string[]>(() =>
    edit ? items.map((i) => i.id) : s.firstOpen && items[0] ? [items[0].id] : [],
  );

  const toggle = (id: string) =>
    setOpen((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : s.allowMultiple || edit ? [...cur, id] : [id]));

  return (
    <div className="cr-accordion">
      {items.map((item, i) => {
        const isOpen = open.includes(item.id);
        const panelId = `${baseId}-${item.id}`;
        return (
          <div key={item.id} className={`cr-acc-item ${isOpen ? "is-open" : ""}`}>
            {edit ? (
              <div className="cr-acc-head">
                <EditableText as="span" className="cr-acc-title" value={item.title} editable placeholder="Título do item"
                  onChange={(v) => update?.((d) => { d.content.items[i].title = v; }, `${block.id}:t:${item.id}`)} />
                <button type="button" className="cr-acc-toggle" onClick={() => toggle(item.id)} aria-label={isOpen ? "Recolher" : "Expandir"}>
                  <Chevron open={isOpen} />
                </button>
              </div>
            ) : (
              <button type="button" className="cr-acc-head" aria-expanded={isOpen} aria-controls={panelId} onClick={() => toggle(item.id)}>
                <span className="cr-acc-title">{item.title}</span>
                <Chevron open={isOpen} />
              </button>
            )}
            <div id={panelId} className="cr-acc-panel" hidden={!isOpen} role="region">
              <RichText html={item.html} editable={edit} placeholder="Conteúdo do item…"
                onChange={(v) => update?.((d) => { d.content.items[i].html = v; }, `${block.id}:h:${item.id}`)} />
            </div>
          </div>
        );
      })}
      {edit && (
        <button type="button" className="cr-inline-add" onClick={() => {
          const id = uid("i");
          update?.((d) => { d.content.items.push({ id, title: "Novo item", html: "<p>Conteúdo do item.</p>" }); });
          setOpen((o) => [...o, id]);
        }}>
          + Adicionar item
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- Abas */
export function TabsView({ block, mode, update }: BlockViewProps<TabsContent, TabsSettings>) {
  const { items } = block.content;
  const s = block.settings;
  const edit = mode === "edit";
  const [activeId, setActiveId] = useState(items[0]?.id);
  const activeIndex = Math.max(0, items.findIndex((t) => t.id === activeId));
  const active = items[activeIndex];
  const baseId = useId();

  const onKey = (e: React.KeyboardEvent) => {
    if (edit) return;
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    const next = items[(activeIndex + dir + items.length) % items.length];
    setActiveId(next.id);
    document.getElementById(`${baseId}-tab-${next.id}`)?.focus();
  };

  return (
    <div className={`cr-tabs cr-tabs--${s.style}`}>
      <div className="cr-tablist" role="tablist" onKeyDown={onKey}>
        {items.map((t, i) => {
          const selected = i === activeIndex;
          return edit ? (
            <div key={t.id} className={`cr-tab ${selected ? "is-active" : ""}`} onClick={() => setActiveId(t.id)}>
              <EditableText value={t.title} editable={selected} placeholder="Aba"
                onChange={(v) => update?.((d) => { d.content.items[i].title = v; }, `${block.id}:t:${t.id}`)} />
            </div>
          ) : (
            <button key={t.id} id={`${baseId}-tab-${t.id}`} type="button" role="tab" aria-selected={selected} tabIndex={selected ? 0 : -1}
              aria-controls={`${baseId}-panel`} className={`cr-tab ${selected ? "is-active" : ""}`} onClick={() => setActiveId(t.id)}>
              {t.title}
            </button>
          );
        })}
        {edit && (
          <button type="button" className="cr-tab cr-tab-add" onClick={() => {
            const id = uid("t");
            update?.((d) => { d.content.items.push({ id, title: "Nova aba", html: "<p>Conteúdo da aba.</p>", media: null }); });
            setActiveId(id);
          }} aria-label="Adicionar aba">+</button>
        )}
      </div>
      {active && (
        <div className="cr-tabpanel" role="tabpanel" id={`${baseId}-panel`} key={active.id}>
          {s.showImages && (
            <MediaImage media={active.media} alt={active.title} mode={mode} className="cr-tab-img"
              onUpload={(m) => update?.((d) => { d.content.items[activeIndex].media = m; })} />
          )}
          <RichText html={active.html} editable={edit} placeholder="Conteúdo da aba…"
            onChange={(v) => update?.((d) => { d.content.items[activeIndex].html = v; }, `${block.id}:h:${active.id}`)} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- Flashcards */
export function FlashcardsView({ block, mode, update }: BlockViewProps<FlashcardsContent, FlashcardsSettings>) {
  const s = block.settings;
  const edit = mode === "edit";
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [index, setIndex] = useState(0);
  const cards = block.content.cards;

  if (edit) {
    return (
      <div className="cr-flash-edit" data-cols={s.columns}>
        {cards.map((c, i) => (
          <div key={c.id} className="cr-flash-edit-card">
            <div className={`cr-flash-edit-side is-front is-${s.frontStyle}`}>
              <small>Frente</small>
              <MediaImage media={c.frontMedia} alt="" mode="view" className="cr-flash-img" />
              <EditableText as="p" value={c.front} editable multiline placeholder="Frente do card"
                onChange={(v) => update?.((d) => { d.content.cards[i].front = v; }, `${block.id}:f:${c.id}`)} />
            </div>
            <div className="cr-flash-edit-side is-back">
              <small>Verso</small>
              <MediaImage media={c.backMedia} alt="" mode="view" className="cr-flash-img" />
              <EditableText as="p" value={c.back} editable multiline placeholder="Verso do card"
                onChange={(v) => update?.((d) => { d.content.cards[i].back = v; }, `${block.id}:b:${c.id}`)} />
            </div>
          </div>
        ))}
        <button type="button" className="cr-inline-add" onClick={() => update?.((d) => {
          d.content.cards.push({ id: uid("f"), front: "Novo termo", back: "Definição", frontMedia: null, backMedia: null });
        })}>
          + Adicionar card
        </button>
      </div>
    );
  }

  const renderCard = (c: (typeof cards)[number]) => {
    const isFlipped = !!flipped[c.id];
    return (
      <button key={c.id} type="button" className={`cr-flashcard h-${s.height} ${isFlipped ? "is-flipped" : ""}`}
        onClick={() => setFlipped((f) => ({ ...f, [c.id]: !f[c.id] }))}
        aria-label={isFlipped ? `Verso: ${c.back}` : `Frente: ${c.front}. Clique para virar.`}>
        <span className="cr-flash-inner">
          <span className={`cr-flash-face is-front is-${s.frontStyle}`} aria-hidden={isFlipped}>
            <MediaImage media={c.frontMedia} alt="" mode="view" className="cr-flash-img" />
            <span className="cr-flash-text">{c.front}</span>
            <span className="cr-flash-hint">Clique para virar ↻</span>
          </span>
          <span className="cr-flash-face is-back" aria-hidden={!isFlipped}>
            <MediaImage media={c.backMedia} alt="" mode="view" className="cr-flash-img" />
            <span className="cr-flash-text">{c.back}</span>
          </span>
        </span>
      </button>
    );
  };

  if (s.layout === "stack") {
    const c = cards[Math.min(index, cards.length - 1)];
    if (!c) return null;
    return (
      <div className="cr-flash-stack">
        {renderCard(c)}
        <div className="cr-stepper">
          <button type="button" className="cr-btn cr-btn--ghost" disabled={index === 0} onClick={() => setIndex(index - 1)}>← Anterior</button>
          <span className="cr-stepper-count">{index + 1} / {cards.length}</span>
          <button type="button" className="cr-btn cr-btn--ghost" disabled={index >= cards.length - 1} onClick={() => setIndex(index + 1)}>Próximo →</button>
        </div>
      </div>
    );
  }
  return <div className="cr-flash-grid" data-cols={s.columns}>{cards.map(renderCard)}</div>;
}

/* ------------------------------------------------------ Processo em etapas */
export function ProcessView({ block, mode, update }: BlockViewProps<ProcessContent, ProcessSettings>) {
  const c = block.content;
  const s = block.settings;
  const edit = mode === "edit";
  const first = s.showIntro ? -1 : 0;
  const last = s.showSummary ? c.steps.length : c.steps.length - 1;
  const [pos, setPos] = useState(first);
  useEffect(() => {
    setPos((p) => Math.min(Math.max(p, first), last));
  }, [first, last]);

  const set = (fn: (d: ProcessContent) => void, key?: string) => update?.((d) => fn(d.content), key);
  const step = pos >= 0 && pos < c.steps.length ? c.steps[pos] : null;

  return (
    <div className="cr-process">
      {c.steps.length > 0 && (
        <ol className="cr-process-track" aria-label="Etapas">
          {c.steps.map((st, i) => (
            <li key={st.id} className={i === pos ? "is-current" : i < pos ? "is-done" : ""}>
              <button type="button" onClick={() => setPos(i)} aria-current={i === pos ? "step" : undefined} aria-label={`Etapa ${i + 1}: ${st.title}`}>
                {s.numbered ? i + 1 : ""}
              </button>
            </li>
          ))}
        </ol>
      )}

      <div className="cr-process-card" key={pos} aria-live="polite">
        {pos === -1 && (
          <>
            <EditableText as="h3" className="cr-h" value={c.introTitle} editable={edit} placeholder="Título da introdução"
              onChange={(v) => set((d) => { d.introTitle = v; }, `${block.id}:it`)} />
            <RichText html={c.introHtml} editable={edit} placeholder="Introdução…" onChange={(v) => set((d) => { d.introHtml = v; }, `${block.id}:ih`)} />
            <div className="cr-process-actions">
              <button type="button" className="cr-btn" onClick={() => setPos(0)} disabled={!c.steps.length}>Começar</button>
            </div>
          </>
        )}
        {step && (
          <>
            <span className="cr-eyebrow">Etapa {pos + 1} de {c.steps.length}</span>
            <EditableText as="h3" className="cr-h" value={step.title} editable={edit} placeholder="Título da etapa"
              onChange={(v) => set((d) => { d.steps[pos].title = v; }, `${block.id}:st:${step.id}`)} />
            {(step.media || edit) && (
              <MediaImage media={step.media} alt={step.title} mode={mode} className="cr-process-img"
                onUpload={(m) => set((d) => { d.steps[pos].media = m; })} placeholderLabel="Imagem da etapa (opcional)" />
            )}
            <RichText html={step.html} editable={edit} placeholder="Descrição da etapa…"
              onChange={(v) => set((d) => { d.steps[pos].html = v; }, `${block.id}:sh:${step.id}`)} />
          </>
        )}
        {pos === c.steps.length && s.showSummary && (
          <>
            <EditableText as="h3" className="cr-h" value={c.summaryTitle} editable={edit} placeholder="Título do resumo"
              onChange={(v) => set((d) => { d.summaryTitle = v; }, `${block.id}:smt`)} />
            <RichText html={c.summaryHtml} editable={edit} placeholder="Resumo…" onChange={(v) => set((d) => { d.summaryHtml = v; }, `${block.id}:smh`)} />
            <div className="cr-process-actions">
              <button type="button" className="cr-btn cr-btn--ghost" onClick={() => setPos(first)}>↺ Recomeçar</button>
            </div>
          </>
        )}
      </div>

      {pos >= 0 && (
        <div className="cr-stepper">
          <button type="button" className="cr-btn cr-btn--ghost" disabled={pos <= first} onClick={() => setPos(pos - 1)}>← Anterior</button>
          {pos < last && <button type="button" className="cr-btn" onClick={() => setPos(pos + 1)}>{pos === c.steps.length - 1 ? "Concluir" : "Próxima etapa →"}</button>}
        </div>
      )}
      {edit && (
        <button type="button" className="cr-inline-add" onClick={() => {
          set((d) => { d.steps.push({ id: uid("s"), title: `Etapa ${d.steps.length + 1}`, html: "<p>Descreva a etapa.</p>", media: null }); });
          setPos(c.steps.length);
        }}>
          + Adicionar etapa
        </button>
      )}
    </div>
  );
}
