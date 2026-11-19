"use client";
import { useRef, useState } from "react";
import { uid } from "@/core/model/ids";
import { EditableText, RichText } from "../../common/Editable";
import { MediaImage } from "../../common/Media";
import type { BlockViewProps } from "../../engine/context";
import type {
  HotspotsContent, HotspotsSettings, RevealCardsContent, RevealCardsSettings, TableContent, TableSettings, TimelineContent,
  TimelineSettings,
} from "./definitions";

function ExploreProgress({ seen, total }: { seen: number; total: number }) {
  return (
    <div className="cr-explore-progress" aria-live="polite">
      <div className="cr-explore-bar"><span style={{ width: `${total ? (seen / total) * 100 : 0}%` }} /></div>
      <span>{seen === total ? "Tudo explorado ✓" : `${seen} de ${total} explorados`}</span>
    </div>
  );
}

/* -------------------------------------------------------- Cards clicáveis */
export function RevealCardsView({ block, mode, update }: BlockViewProps<RevealCardsContent, RevealCardsSettings>) {
  const s = block.settings;
  const cards = block.content.cards;
  const [active, setActive] = useState<string | null>(null);
  const [seen, setSeen] = useState<string[]>([]);

  if (mode === "edit") {
    return (
      <div className="cr-reveal" data-cols={s.columns}>
        <div className="cr-reveal-grid">
          {cards.map((c, i) => (
            <div key={c.id} className="cr-reveal-card is-editing">
              {s.showImages && <MediaImage media={c.media} alt="" mode="edit" className="cr-reveal-img" placeholderLabel="Imagem do card"
                onUpload={(m) => update?.((d) => { d.content.cards[i].media = m; })} />}
              <EditableText as="h4" className="cr-h" value={c.title} editable placeholder="Título do card"
                onChange={(v) => update?.((d) => { d.content.cards[i].title = v; }, `${block.id}:t:${c.id}`)} />
              <EditableText as="p" className="cr-reveal-summary" value={c.summary} editable placeholder="Chamada (visível antes do clique)"
                onChange={(v) => update?.((d) => { d.content.cards[i].summary = v; }, `${block.id}:s:${c.id}`)} />
              <div className="cr-reveal-hidden">
                <small>Revelado ao clicar</small>
                <RichText html={c.html} editable placeholder="Conteúdo revelado…"
                  onChange={(v) => update?.((d) => { d.content.cards[i].html = v; }, `${block.id}:h:${c.id}`)} />
              </div>
            </div>
          ))}
        </div>
        <button type="button" className="cr-inline-add" onClick={() => update?.((d) => {
          d.content.cards.push({ id: uid("k"), title: "Novo card", summary: "Clique para saber mais", html: "<p>Conteúdo revelado.</p>", media: null });
        })}>+ Adicionar card</button>
      </div>
    );
  }

  const open = cards.find((c) => c.id === active);
  return (
    <div className="cr-reveal" data-cols={s.columns}>
      <div className="cr-reveal-grid">
        {cards.map((c) => (
          <button key={c.id} type="button" aria-expanded={active === c.id} aria-controls={`${block.id}-detail`}
            className={`cr-reveal-card ${active === c.id ? "is-active" : ""} ${seen.includes(c.id) ? "is-seen" : ""}`}
            onClick={() => {
              setActive(active === c.id ? null : c.id);
              setSeen((x) => (x.includes(c.id) ? x : [...x, c.id]));
            }}>
            {s.showImages && <MediaImage media={c.media} alt="" mode="view" className="cr-reveal-img" />}
            <span className="cr-h cr-reveal-title">{c.title}</span>
            {c.summary && <span className="cr-reveal-summary">{c.summary}</span>}
            <span className="cr-reveal-icon" aria-hidden>{seen.includes(c.id) && active !== c.id ? "✓" : active === c.id ? "−" : "+"}</span>
          </button>
        ))}
      </div>
      {open && (
        <div className="cr-reveal-detail" id={`${block.id}-detail`} role="region" aria-label={open.title} key={open.id}>
          <h4 className="cr-h">{open.title}</h4>
          <RichText html={open.html} editable={false} />
        </div>
      )}
      {s.trackProgress && <ExploreProgress seen={seen.length} total={cards.length} />}
    </div>
  );
}

/* ------------------------------------------------- Imagem com marcadores */
export function HotspotsView({ block, mode, update }: BlockViewProps<HotspotsContent, HotspotsSettings>) {
  const c = block.content;
  const s = block.settings;
  const edit = mode === "edit";
  const [active, setActive] = useState<string | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; moved: boolean } | null>(null);

  const pointToPct = (clientX: number, clientY: number) => {
    const r = frame.current!.getBoundingClientRect();
    const clamp = (v: number) => Math.round(Math.min(97, Math.max(3, v)) * 10) / 10;
    return { x: clamp(((clientX - r.left) / r.width) * 100), y: clamp(((clientY - r.top) / r.height) * 100) };
  };

  if (!c.media) {
    return edit ? <MediaImage media={null} alt="" mode="edit" placeholderLabel="Envie a imagem base (tela, equipamento, mapa…)"
      onUpload={(m) => update?.((d) => { d.content.media = m; })} /> : null;
  }

  const activeIndex = c.markers.findIndex((m) => m.id === active);
  const activeMarker = c.markers[activeIndex];

  return (
    <div className="cr-hotspots">
      <div
        ref={frame}
        className={`cr-hotspots-frame ${edit ? "is-editing" : ""}`}
        onClick={(e) => {
          if (!edit || e.target !== e.currentTarget.querySelector("img")) return;
          const { x, y } = pointToPct(e.clientX, e.clientY);
          const id = uid("h");
          update?.((d) => { d.content.markers.push({ id, x, y, title: `Ponto ${d.content.markers.length + 1}`, html: "<p>Descreva este elemento.</p>" }); });
          setActive(id);
        }}
      >
        <MediaImage media={c.media} alt={c.alt} mode={mode} className="cr-hotspots-img" />
        {c.markers.map((m, i) => (
          <button
            key={m.id}
            type="button"
            className={`cr-marker is-${s.markerStyle} ${s.pulse && !edit && !seen.includes(m.id) ? "is-pulse" : ""} ${active === m.id ? "is-active" : ""} ${seen.includes(m.id) ? "is-seen" : ""}`}
            style={{ left: `${m.x}%`, top: `${m.y}%` }}
            aria-label={`${i + 1}. ${m.title}`}
            aria-expanded={active === m.id}
            onPointerDown={(e) => {
              if (!edit) return;
              e.stopPropagation();
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              drag.current = { id: m.id, moved: false };
            }}
            onPointerMove={(e) => {
              if (!edit || drag.current?.id !== m.id) return;
              drag.current.moved = true;
              const { x, y } = pointToPct(e.clientX, e.clientY);
              update?.((d) => {
                const mk = d.content.markers.find((k) => k.id === m.id);
                if (mk) { mk.x = x; mk.y = y; }
              }, `${block.id}:move:${m.id}`);
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
            onClick={(e) => {
              e.stopPropagation();
              // No editor, clicar (ou terminar de arrastar) seleciona o marcador para edição.
              if (edit) return setActive(m.id);
              setActive(active === m.id ? null : m.id);
              if (!edit) setSeen((x) => (x.includes(m.id) ? x : [...x, m.id]));
            }}
          >
            {s.markerStyle === "numbered" ? i + 1 : "+"}
          </button>
        ))}
        {activeMarker && !edit && (
          <div className="cr-hotspot-pop" role="dialog" aria-label={activeMarker.title}
            data-side={activeMarker.x > 55 ? "left" : "right"} style={{ left: `${activeMarker.x}%`, top: `${activeMarker.y}%` }}>
            <button type="button" className="cr-hotspot-close" aria-label="Fechar" onClick={() => setActive(null)}>×</button>
            <h4 className="cr-h">{activeMarker.title}</h4>
            <RichText html={activeMarker.html} editable={false} />
          </div>
        )}
      </div>
      {edit && (
        activeMarker ? (
          <div className="cr-hotspot-editor" key={activeMarker.id}>
            <span className="cr-eyebrow">Marcador {activeIndex + 1}</span>
            <EditableText as="h4" className="cr-h" value={activeMarker.title} editable placeholder="Título do marcador"
              onChange={(v) => update?.((d) => { d.content.markers[activeIndex].title = v; }, `${block.id}:t:${activeMarker.id}`)} />
            <RichText html={activeMarker.html} editable placeholder="Descrição…"
              onChange={(v) => update?.((d) => { d.content.markers[activeIndex].html = v; }, `${block.id}:h:${activeMarker.id}`)} />
            <button type="button" className="cr-inline-add is-danger" onClick={() => {
              update?.((d) => { d.content.markers.splice(activeIndex, 1); });
              setActive(null);
            }}>Remover marcador</button>
          </div>
        ) : (
          <p className="cr-edit-hint">Clique na imagem para adicionar um marcador. Arraste marcadores para reposicionar; clique em um para editar.</p>
        )
      )}
      {!edit && s.trackProgress && c.markers.length > 0 && <ExploreProgress seen={seen.length} total={c.markers.length} />}
    </div>
  );
}

/* ---------------------------------------------------------- Linha do tempo */
export function TimelineView({ block, mode, update }: BlockViewProps<TimelineContent, TimelineSettings>) {
  const s = block.settings;
  const edit = mode === "edit";
  return (
    <div className="cr-timeline" data-layout={s.layout}>
      <ol className="cr-timeline-list">
        {block.content.items.map((it, i) => (
          <li key={it.id} className="cr-timeline-item">
            <span className="cr-timeline-dot" aria-hidden />
            <div className="cr-timeline-card">
              <EditableText as="span" className="cr-eyebrow" value={it.date} editable={edit} placeholder="Data ou etapa"
                onChange={(v) => update?.((d) => { d.content.items[i].date = v; }, `${block.id}:d:${it.id}`)} />
              <EditableText as="h4" className="cr-h" value={it.title} editable={edit} placeholder="Título"
                onChange={(v) => update?.((d) => { d.content.items[i].title = v; }, `${block.id}:t:${it.id}`)} />
              {s.showImages && (it.media || edit) && (
                <MediaImage media={it.media} alt={it.title} mode={mode} className="cr-timeline-img"
                  onUpload={(m) => update?.((d) => { d.content.items[i].media = m; })} />
              )}
              <RichText html={it.html} editable={edit} placeholder="Descrição…"
                onChange={(v) => update?.((d) => { d.content.items[i].html = v; }, `${block.id}:h:${it.id}`)} />
            </div>
          </li>
        ))}
      </ol>
      {edit && (
        <button type="button" className="cr-inline-add" onClick={() => update?.((d) => {
          d.content.items.push({ id: uid("t"), date: `Etapa ${d.content.items.length + 1}`, title: "Novo marco", html: "<p>Descrição.</p>", media: null });
        })}>+ Adicionar marco</button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Tabela */
export function TableView({ block, mode, update }: BlockViewProps<TableContent, TableSettings>) {
  const c = block.content;
  const s = block.settings;
  const edit = mode === "edit";
  return (
    <figure className={`cr-table ${s.striped ? "is-striped" : ""} ${s.compact ? "is-compact" : ""}`}>
      <div className="cr-table-scroll" tabIndex={edit ? undefined : 0} role={edit ? undefined : "region"} aria-label={c.caption || "Tabela"}>
        <table>
          {s.headerRow && (
            <thead>
              <tr>
                {c.columns.map((col, ci) => (
                  <th key={col.id} scope="col">
                    <EditableText value={col.label} editable={edit} placeholder="Coluna"
                      onChange={(v) => update?.((d) => { d.content.columns[ci].label = v; }, `${block.id}:col:${col.id}`)} />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {c.rows.map((row, ri) => (
              <tr key={row.id}>
                {c.columns.map((col, ci) => {
                  const Cell = s.firstColumnHeader && ci === 0 ? "th" : "td";
                  return (
                    <Cell key={col.id} scope={Cell === "th" ? "row" : undefined}>
                      <EditableText value={row.cells[ci] ?? ""} editable={edit} placeholder="—" multiline
                        onChange={(v) => update?.((d) => {
                          const r = d.content.rows[ri];
                          while (r.cells.length < d.content.columns.length) r.cells.push("");
                          r.cells[ci] = v;
                        }, `${block.id}:cell:${row.id}:${ci}`)} />
                    </Cell>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(c.caption || edit) && (
        <EditableText as="figcaption" className="cr-caption" value={c.caption} editable={edit} placeholder="Legenda da tabela (opcional)"
          onChange={(v) => update?.((d) => { d.content.caption = v; }, `${block.id}:caption`)} />
      )}
      {edit && (
        <div className="cr-table-actions">
          <button type="button" className="cr-inline-add" onClick={() => update?.((d) => {
            d.content.rows.push({ id: uid("r"), cells: d.content.columns.map(() => "") });
          })}>+ Linha</button>
          <button type="button" className="cr-inline-add" onClick={() => update?.((d) => {
            d.content.columns.push({ id: uid("col"), label: `Coluna ${d.content.columns.length + 1}` });
            d.content.rows.forEach((r) => r.cells.push(""));
          })}>+ Coluna</button>
        </div>
      )}
    </figure>
  );
}
