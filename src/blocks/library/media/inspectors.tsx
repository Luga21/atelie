"use client";
import { uid } from "@/core/model/ids";
import { Field, ItemsField, MediaField, moveItem, Section, Segmented, TextField, ToggleField } from "../../editor-ui/fields";
import type { BlockInspectorProps } from "../../editor-ui/types";
import type { AudioContent, AudioSettings, GalleryContent, GallerySettings } from "./definitions";

export function GalleryInspector({ block, update }: BlockInspectorProps<GalleryContent, GallerySettings>) {
  const s = block.settings;
  return (
    <>
      <Section title="Exibição">
        <Field label="Layout">
          <Segmented value={s.layout} onChange={(v) => update((d) => { d.settings.layout = v; })}
            options={[{ value: "grid", label: "Grade" }, { value: "carousel", label: "Carrossel" }]} />
        </Field>
        {s.layout === "grid" && (
          <Field label="Colunas">
            <Segmented value={s.columns} onChange={(v) => update((d) => { d.settings.columns = v; })} options={[2, 3, 4].map((n) => ({ value: n as 2, label: String(n) }))} />
          </Field>
        )}
        <Field label="Proporção">
          <Segmented value={s.aspect} onChange={(v) => update((d) => { d.settings.aspect = v; })}
            options={[{ value: "square", label: "1:1" }, { value: "landscape", label: "Paisagem" }, { value: "portrait", label: "Retrato" }]} />
        </Field>
        <ToggleField label="Legendas" checked={s.showCaptions} onChange={(v) => update((d) => { d.settings.showCaptions = v; })} />
      </Section>
      <Section title="Imagens">
        <ItemsField label="Imagens" items={block.content.images} getTitle={(img, i) => img.caption || img.alt || `Imagem ${i + 1}${img.media ? "" : " (vazia)"}`}
          onAdd={() => update((d) => { d.content.images.push({ id: uid("g"), media: null, alt: "", caption: "" }); })}
          onRemove={(i) => update((d) => { d.content.images.splice(i, 1); })}
          onMove={(a, b) => update((d) => moveItem(d.content.images, a, b))}
          renderItem={(img, i) => (
            <>
              <MediaField label="Arquivo" value={img.media} onChange={(m) => update((d) => { d.content.images[i].media = m; })} />
              <TextField label="Texto alternativo" value={img.alt} onChange={(v) => update((d) => { d.content.images[i].alt = v; }, `${block.id}:alt:${img.id}`)} />
              <TextField label="Legenda" value={img.caption} onChange={(v) => update((d) => { d.content.images[i].caption = v; }, `${block.id}:cap:${img.id}`)} />
            </>
          )} />
      </Section>
    </>
  );
}

export function AudioInspector({ block, update }: BlockInspectorProps<AudioContent, AudioSettings>) {
  return (
    <Section title="Áudio">
      <MediaField label="Arquivo" kind="audio" value={block.content.source} onChange={(m) => update((d) => { d.content.source = m; })} />
      <ToggleField label="Exibir transcrição" hint="Recomendado para acessibilidade" checked={block.settings.showTranscript}
        onChange={(v) => update((d) => { d.settings.showTranscript = v; })} />
      {block.settings.showTranscript && (
        <TextField label="Transcrição" multiline value={block.content.transcript} placeholder="Texto falado no áudio…"
          onChange={(v) => update((d) => { d.content.transcript = v; }, `${block.id}:transcript`)} />
      )}
    </Section>
  );
}
