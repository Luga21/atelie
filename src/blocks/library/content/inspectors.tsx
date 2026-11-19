"use client";
import { uid } from "@/core/model/ids";
import { Field, ItemsField, MediaField, moveItem, Section, Segmented, TextField, ToggleField } from "../../editor-ui/fields";
import type { BlockInspectorProps } from "../../editor-ui/types";
import type {
  ColumnsContent, ColumnsSettings, DividerContent, DividerSettings, HeadingContent, HeadingSettings, ImageContent,
  ImageSettings, ListContent, ListSettings, QuoteContent, QuoteSettings, TextContent, TextImageContent,
  TextImageSettings, TextSettings, VideoContent, VideoSettings,
} from "./definitions";

const ALIGN2 = [{ value: "left" as const, label: "Esquerda" }, { value: "center" as const, label: "Centro" }];
const ALIGN3 = [{ value: "left" as const, label: "Esq." }, { value: "center" as const, label: "Centro" }, { value: "right" as const, label: "Dir." }];

export function TextInspector({ block, update }: BlockInspectorProps<TextContent, TextSettings>) {
  const s = block.settings;
  return (
    <Section title="Aparência">
      <Field label="Estilo do texto">
        <Segmented value={s.variant} onChange={(v) => update((d) => { d.settings.variant = v; })}
          options={[{ value: "paragraph", label: "Parágrafo" }, { value: "lead", label: "Destaque" }, { value: "callout", label: "Nota" }]} />
      </Field>
      <Field label="Alinhamento">
        <Segmented value={s.align} onChange={(v) => update((d) => { d.settings.align = v; })} options={ALIGN2} />
      </Field>
      <p className="text-[11px] leading-relaxed text-ink-500">Edite o texto diretamente no canvas. Selecione um trecho para aplicar negrito, itálico, links e listas.</p>
    </Section>
  );
}

export function HeadingInspector({ block, update }: BlockInspectorProps<HeadingContent, HeadingSettings>) {
  const s = block.settings;
  return (
    <Section title="Aparência">
      <Field label="Tamanho">
        <Segmented value={s.size} onChange={(v) => update((d) => { d.settings.size = v; })}
          options={[{ value: "h1", label: "Grande" }, { value: "h2", label: "Médio" }, { value: "h3", label: "Pequeno" }]} />
      </Field>
      <Field label="Alinhamento">
        <Segmented value={s.align} onChange={(v) => update((d) => { d.settings.align = v; })} options={ALIGN2} />
      </Field>
      <ToggleField label="Subtítulo" checked={s.showSubtitle} onChange={(v) => update((d) => { d.settings.showSubtitle = v; })} />
      <ToggleField label="Linha de destaque" hint="Usa a cor de destaque do tema" checked={s.accentLine} onChange={(v) => update((d) => { d.settings.accentLine = v; })} />
    </Section>
  );
}

export function ImageInspector({ block, update }: BlockInspectorProps<ImageContent, ImageSettings>) {
  const c = block.content;
  const s = block.settings;
  return (
    <>
      <Section title="Imagem">
        <MediaField label="Arquivo" value={c.media} onChange={(m) => update((d) => { d.content.media = m; })} />
        <TextField label="Texto alternativo" hint="Descreve a imagem para leitores de tela" value={c.alt}
          onChange={(v) => update((d) => { d.content.alt = v; }, `${block.id}:alt`)} placeholder="Ex.: Equipe reunida em sala" />
        <TextField label="Legenda" value={c.caption} onChange={(v) => update((d) => { d.content.caption = v; }, `${block.id}:caption`)} />
      </Section>
      <Section title="Exibição">
        <Field label="Largura">
          <Segmented value={s.size} onChange={(v) => update((d) => { d.settings.size = v; })}
            options={[{ value: "s", label: "P" }, { value: "m", label: "M" }, { value: "l", label: "G" }, { value: "full", label: "Total" }]} />
        </Field>
        <Field label="Alinhamento">
          <Segmented value={s.align} onChange={(v) => update((d) => { d.settings.align = v; })} options={ALIGN3} />
        </Field>
        <ToggleField label="Cantos arredondados" checked={s.rounded} onChange={(v) => update((d) => { d.settings.rounded = v; })} />
        <ToggleField label="Ampliar ao clicar" checked={s.zoom} onChange={(v) => update((d) => { d.settings.zoom = v; })} />
      </Section>
    </>
  );
}

export function TextImageInspector({ block, update }: BlockInspectorProps<TextImageContent, TextImageSettings>) {
  const c = block.content;
  const s = block.settings;
  return (
    <>
      <Section title="Imagem">
        <MediaField label="Arquivo" value={c.media} onChange={(m) => update((d) => { d.content.media = m; })} />
        <TextField label="Texto alternativo" value={c.alt} onChange={(v) => update((d) => { d.content.alt = v; }, `${block.id}:alt`)} />
      </Section>
      <Section title="Layout">
        <Field label="Posição da imagem">
          <Segmented value={s.imageSide} onChange={(v) => update((d) => { d.settings.imageSide = v; })}
            options={[{ value: "left", label: "Esquerda" }, { value: "right", label: "Direita" }]} />
        </Field>
        <Field label="Largura da imagem">
          <Segmented value={s.imageRatio} onChange={(v) => update((d) => { d.settings.imageRatio = v; })}
            options={[{ value: "1/3", label: "1/3" }, { value: "1/2", label: "1/2" }]} />
        </Field>
        <Field label="Alinhamento vertical">
          <Segmented value={s.verticalAlign} onChange={(v) => update((d) => { d.settings.verticalAlign = v; })}
            options={[{ value: "top", label: "Topo" }, { value: "center", label: "Centro" }]} />
        </Field>
        <ToggleField label="Exibir título" checked={s.showTitle} onChange={(v) => update((d) => { d.settings.showTitle = v; })} />
      </Section>
    </>
  );
}

export function VideoInspector({ block, update }: BlockInspectorProps<VideoContent, VideoSettings>) {
  return (
    <Section title="Vídeo">
      <MediaField label="Fonte" kind="video" value={block.content.source} onChange={(m) => update((d) => { d.content.source = m; })} />
      <Field label="Proporção">
        <Segmented value={block.settings.aspect} onChange={(v) => update((d) => { d.settings.aspect = v; })}
          options={[{ value: "16:9", label: "16:9" }, { value: "4:3", label: "4:3" }, { value: "1:1", label: "1:1" }, { value: "9:16", label: "9:16" }]} />
      </Field>
      <p className="text-[11px] leading-relaxed text-ink-500">Links do YouTube e Vimeo são incorporados automaticamente. Vídeos externos exigem conexão no momento da visualização.</p>
    </Section>
  );
}

export function ListInspector({ block, update }: BlockInspectorProps<ListContent, ListSettings>) {
  const s = block.settings;
  return (
    <>
      <Section title="Aparência">
        <Field label="Marcador">
          <Segmented value={s.style} onChange={(v) => update((d) => { d.settings.style = v; })}
            options={[{ value: "bullet", label: "• Ponto" }, { value: "number", label: "1. Número" }, { value: "check", label: "✓ Check" }]} />
        </Field>
        <Field label="Colunas">
          <Segmented value={s.columns} onChange={(v) => update((d) => { d.settings.columns = v; })} options={[{ value: 1, label: "1" }, { value: 2, label: "2" }]} />
        </Field>
        <ToggleField label="Exibir título" checked={s.showTitle} onChange={(v) => update((d) => { d.settings.showTitle = v; })} />
      </Section>
      <Section title="Itens">
        <ItemsField label="Itens da lista" items={block.content.items} getTitle={(i) => i.text}
          onAdd={() => update((d) => { d.content.items.push({ id: uid("i"), text: "Novo item" }); })}
          onRemove={(i) => update((d) => { d.content.items.splice(i, 1); })}
          onMove={(a, b) => update((d) => moveItem(d.content.items, a, b))}
          renderItem={(item, i) => (
            <TextField label="Texto" value={item.text} onChange={(v) => update((d) => { d.content.items[i].text = v; }, `${block.id}:item:${item.id}`)} />
          )} />
      </Section>
    </>
  );
}

export function QuoteInspector({ block, update }: BlockInspectorProps<QuoteContent, QuoteSettings>) {
  return (
    <Section title="Aparência">
      <Field label="Estilo">
        <Segmented value={block.settings.style} onChange={(v) => update((d) => { d.settings.style = v; })}
          options={[{ value: "classic", label: "Clássico" }, { value: "highlight", label: "Destaque" }]} />
      </Field>
    </Section>
  );
}

export function DividerInspector({ block, update }: BlockInspectorProps<DividerContent, DividerSettings>) {
  return (
    <Section title="Aparência">
      <Field label="Estilo">
        <Segmented value={block.settings.style} onChange={(v) => update((d) => { d.settings.style = v; })}
          options={[{ value: "line", label: "Linha" }, { value: "dots", label: "Pontos" }, { value: "space", label: "Espaço" }]} />
      </Field>
      {block.settings.style !== "space" && (
        <TextField label="Rótulo" value={block.content.label} placeholder="Opcional"
          onChange={(v) => update((d) => { d.content.label = v; }, `${block.id}:label`)} />
      )}
    </Section>
  );
}

export function ColumnsInspector({ block, update }: BlockInspectorProps<ColumnsContent, ColumnsSettings>) {
  const s = block.settings;
  return (
    <>
      <Section title="Layout">
        <Field label="Número de colunas">
          <Segmented value={s.count} onChange={(v) => update((d) => {
            d.settings.count = v;
            while (d.content.columns.length < v) d.content.columns.push({ id: uid("c"), title: `Coluna ${d.content.columns.length + 1}`, html: "<p>Conteúdo da coluna.</p>", media: null });
          })} options={[{ value: 2, label: "2 colunas" }, { value: 3, label: "3 colunas" }]} />
        </Field>
        <ToggleField label="Estilo de card" checked={s.card} onChange={(v) => update((d) => { d.settings.card = v; })} />
        <ToggleField label="Imagens nas colunas" checked={s.showImages} onChange={(v) => update((d) => { d.settings.showImages = v; })} />
      </Section>
      {s.showImages && (
        <Section title="Imagens">
          {block.content.columns.slice(0, s.count).map((c, i) => (
            <MediaField key={c.id} label={c.title || `Coluna ${i + 1}`} value={c.media} onChange={(m) => update((d) => { d.content.columns[i].media = m; })} />
          ))}
        </Section>
      )}
    </>
  );
}
