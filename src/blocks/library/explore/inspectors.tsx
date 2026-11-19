"use client";
import { uid } from "@/core/model/ids";
import { Field, ItemsField, MediaField, moveItem, Section, Segmented, TextField, ToggleField } from "../../editor-ui/fields";
import type { BlockInspectorProps } from "../../editor-ui/types";
import type {
  HotspotsContent, HotspotsSettings, RevealCardsContent, RevealCardsSettings, TableContent, TableSettings, TimelineContent,
  TimelineSettings,
} from "./definitions";

export function RevealCardsInspector({ block, update }: BlockInspectorProps<RevealCardsContent, RevealCardsSettings>) {
  const s = block.settings;
  return (
    <>
      <Section title="Layout e interação">
        <Field label="Colunas">
          <Segmented value={s.columns} onChange={(v) => update((d) => { d.settings.columns = v; })} options={[{ value: 2, label: "2" }, { value: 3, label: "3" }]} />
        </Field>
        <ToggleField label="Imagens nos cards" checked={s.showImages} onChange={(v) => update((d) => { d.settings.showImages = v; })} />
        <ToggleField label="Mostrar progresso de exploração" checked={s.trackProgress} onChange={(v) => update((d) => { d.settings.trackProgress = v; })} />
      </Section>
      <Section title="Cards">
        <ItemsField label="Cards" items={block.content.cards} getTitle={(c) => c.title}
          onAdd={() => update((d) => { d.content.cards.push({ id: uid("k"), title: "Novo card", summary: "Clique para saber mais", html: "<p>Conteúdo revelado.</p>", media: null }); })}
          onRemove={(i) => update((d) => { d.content.cards.splice(i, 1); })}
          onDuplicate={(i) => update((d) => { d.content.cards.splice(i + 1, 0, { ...d.content.cards[i], id: uid("k") }); })}
          onMove={(a, b) => update((d) => moveItem(d.content.cards, a, b))}
          renderItem={(c, i) => (
            <>
              <TextField label="Título" value={c.title} onChange={(v) => update((d) => { d.content.cards[i].title = v; }, `${block.id}:t:${c.id}`)} />
              <TextField label="Chamada" value={c.summary} onChange={(v) => update((d) => { d.content.cards[i].summary = v; }, `${block.id}:s:${c.id}`)} />
              {s.showImages && <MediaField label="Imagem" value={c.media} onChange={(m) => update((d) => { d.content.cards[i].media = m; })} />}
            </>
          )} />
      </Section>
    </>
  );
}

export function HotspotsInspector({ block, update }: BlockInspectorProps<HotspotsContent, HotspotsSettings>) {
  const c = block.content;
  const s = block.settings;
  return (
    <>
      <Section title="Imagem base">
        <MediaField label="Arquivo" value={c.media} onChange={(m) => update((d) => { d.content.media = m; })} />
        <TextField label="Texto alternativo" value={c.alt} onChange={(v) => update((d) => { d.content.alt = v; }, `${block.id}:alt`)} />
      </Section>
      <Section title="Marcadores">
        <Field label="Estilo">
          <Segmented value={s.markerStyle} onChange={(v) => update((d) => { d.settings.markerStyle = v; })}
            options={[{ value: "numbered", label: "Numerado" }, { value: "plus", label: "Ícone +" }]} />
        </Field>
        <ToggleField label="Animação de pulso" hint="Até o aluno visitar o marcador" checked={s.pulse} onChange={(v) => update((d) => { d.settings.pulse = v; })} />
        <ToggleField label="Mostrar progresso de exploração" checked={s.trackProgress} onChange={(v) => update((d) => { d.settings.trackProgress = v; })} />
        <ItemsField label="Marcadores" items={c.markers} min={0} getTitle={(m) => m.title}
          onAdd={() => update((d) => { d.content.markers.push({ id: uid("h"), x: 50, y: 50, title: `Ponto ${d.content.markers.length + 1}`, html: "<p>Descreva este elemento.</p>" }); })}
          onRemove={(i) => update((d) => { d.content.markers.splice(i, 1); })}
          onMove={(a, b) => update((d) => moveItem(d.content.markers, a, b))}
          renderItem={(m, i) => (
            <>
              <TextField label="Título" value={m.title} onChange={(v) => update((d) => { d.content.markers[i].title = v; }, `${block.id}:t:${m.id}`)} />
              {(["x", "y"] as const).map((axis) => (
                <Field key={axis} label={`Posição ${axis === "x" ? "horizontal" : "vertical"} · ${m[axis]}%`}>
                  <input type="range" min={3} max={97} step={0.5} value={m[axis]} className="w-full accent-[var(--color-brand-500)]"
                    onChange={(e) => update((d) => { d.content.markers[i][axis] = Number(e.target.value); }, `${block.id}:${axis}:${m.id}`)} />
                </Field>
              ))}
            </>
          )} />
        <p className="text-[11px] text-ink-500">Dica: no canvas, clique na imagem para criar e arraste para reposicionar.</p>
      </Section>
    </>
  );
}

export function TimelineInspector({ block, update }: BlockInspectorProps<TimelineContent, TimelineSettings>) {
  const s = block.settings;
  return (
    <>
      <Section title="Layout">
        <Field label="Disposição">
          <Segmented value={s.layout} onChange={(v) => update((d) => { d.settings.layout = v; })}
            options={[{ value: "vertical", label: "Vertical" }, { value: "alternate", label: "Alternada" }]} />
        </Field>
        <ToggleField label="Imagens nos marcos" checked={s.showImages} onChange={(v) => update((d) => { d.settings.showImages = v; })} />
      </Section>
      <Section title="Marcos">
        <ItemsField label="Marcos" items={block.content.items} getTitle={(it) => `${it.date} · ${it.title}`}
          onAdd={() => update((d) => { d.content.items.push({ id: uid("t"), date: `Etapa ${d.content.items.length + 1}`, title: "Novo marco", html: "<p>Descrição.</p>", media: null }); })}
          onRemove={(i) => update((d) => { d.content.items.splice(i, 1); })}
          onMove={(a, b) => update((d) => moveItem(d.content.items, a, b))}
          renderItem={(it, i) => (
            <>
              <TextField label="Data ou etapa" value={it.date} onChange={(v) => update((d) => { d.content.items[i].date = v; }, `${block.id}:d:${it.id}`)} />
              <TextField label="Título" value={it.title} onChange={(v) => update((d) => { d.content.items[i].title = v; }, `${block.id}:t:${it.id}`)} />
              {s.showImages && <MediaField label="Imagem" value={it.media} onChange={(m) => update((d) => { d.content.items[i].media = m; })} />}
            </>
          )} />
      </Section>
    </>
  );
}

export function TableInspector({ block, update }: BlockInspectorProps<TableContent, TableSettings>) {
  const s = block.settings;
  const c = block.content;
  return (
    <>
      <Section title="Aparência">
        <ToggleField label="Linha de cabeçalho" checked={s.headerRow} onChange={(v) => update((d) => { d.settings.headerRow = v; })} />
        <ToggleField label="Primeira coluna como cabeçalho" checked={s.firstColumnHeader} onChange={(v) => update((d) => { d.settings.firstColumnHeader = v; })} />
        <ToggleField label="Linhas zebradas" checked={s.striped} onChange={(v) => update((d) => { d.settings.striped = v; })} />
        <ToggleField label="Compacta" checked={s.compact} onChange={(v) => update((d) => { d.settings.compact = v; })} />
      </Section>
      <Section title="Colunas">
        <ItemsField label="Colunas" items={c.columns} getTitle={(col) => col.label} addLabel="Adicionar coluna"
          onAdd={() => update((d) => { d.content.columns.push({ id: uid("col"), label: `Coluna ${d.content.columns.length + 1}` }); d.content.rows.forEach((r) => r.cells.push("")); })}
          onRemove={(i) => update((d) => { d.content.columns.splice(i, 1); d.content.rows.forEach((r) => r.cells.splice(i, 1)); })}
          onMove={(a, b) => update((d) => { moveItem(d.content.columns, a, b); d.content.rows.forEach((r) => moveItem(r.cells, a, b)); })}
          renderItem={(col, i) => (
            <TextField label="Rótulo" value={col.label} onChange={(v) => update((d) => { d.content.columns[i].label = v; }, `${block.id}:col:${col.id}`)} />
          )} />
      </Section>
      <Section title="Linhas">
        <ItemsField label="Linhas" items={c.rows} getTitle={(r) => r.cells[0] || "(vazia)"} addLabel="Adicionar linha"
          onAdd={() => update((d) => { d.content.rows.push({ id: uid("r"), cells: d.content.columns.map(() => "") }); })}
          onRemove={(i) => update((d) => { d.content.rows.splice(i, 1); })}
          onDuplicate={(i) => update((d) => { d.content.rows.splice(i + 1, 0, { id: uid("r"), cells: [...d.content.rows[i].cells] }); })}
          onMove={(a, b) => update((d) => moveItem(d.content.rows, a, b))}
          renderItem={() => <p className="text-[11px] text-ink-500">Edite as células diretamente na tabela, no canvas.</p>} />
      </Section>
    </>
  );
}
