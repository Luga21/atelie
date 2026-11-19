"use client";
import { uid } from "@/core/model/ids";
import { Field, ItemsField, MediaField, moveItem, Section, Segmented, TextField, ToggleField } from "../../editor-ui/fields";
import type { BlockInspectorProps } from "../../editor-ui/types";
import type {
  AccordionContent, AccordionSettings, FlashcardsContent, FlashcardsSettings, ProcessContent, ProcessSettings,
  TabsContent, TabsSettings,
} from "./definitions";

export function AccordionInspector({ block, update }: BlockInspectorProps<AccordionContent, AccordionSettings>) {
  const s = block.settings;
  return (
    <>
      <Section title="Comportamento">
        <ToggleField label="Vários abertos ao mesmo tempo" checked={s.allowMultiple} onChange={(v) => update((d) => { d.settings.allowMultiple = v; })} />
        <ToggleField label="Primeiro item aberto" hint="Ao carregar a aula" checked={s.firstOpen} onChange={(v) => update((d) => { d.settings.firstOpen = v; })} />
      </Section>
      <Section title="Itens">
        <ItemsField label="Seções" items={block.content.items} getTitle={(i) => i.title}
          onAdd={() => update((d) => { d.content.items.push({ id: uid("i"), title: "Novo item", html: "<p>Conteúdo do item.</p>" }); })}
          onRemove={(i) => update((d) => { d.content.items.splice(i, 1); })}
          onDuplicate={(i) => update((d) => { d.content.items.splice(i + 1, 0, { ...d.content.items[i], id: uid("i") }); })}
          onMove={(a, b) => update((d) => moveItem(d.content.items, a, b))}
          renderItem={(item, i) => (
            <TextField label="Título" value={item.title} onChange={(v) => update((d) => { d.content.items[i].title = v; }, `${block.id}:t:${item.id}`)} />
          )} />
        <p className="text-[11px] text-ink-500">O conteúdo de cada item é editado diretamente no canvas.</p>
      </Section>
    </>
  );
}

export function TabsInspector({ block, update }: BlockInspectorProps<TabsContent, TabsSettings>) {
  const s = block.settings;
  return (
    <>
      <Section title="Aparência">
        <Field label="Estilo das abas">
          <Segmented value={s.style} onChange={(v) => update((d) => { d.settings.style = v; })}
            options={[{ value: "underline", label: "Sublinhado" }, { value: "pills", label: "Pílulas" }]} />
        </Field>
        <ToggleField label="Imagem em cada aba" checked={s.showImages} onChange={(v) => update((d) => { d.settings.showImages = v; })} />
      </Section>
      <Section title="Abas">
        <ItemsField label="Abas" items={block.content.items} getTitle={(i) => i.title}
          onAdd={() => update((d) => { d.content.items.push({ id: uid("t"), title: "Nova aba", html: "<p>Conteúdo da aba.</p>", media: null }); })}
          onRemove={(i) => update((d) => { d.content.items.splice(i, 1); })}
          onMove={(a, b) => update((d) => moveItem(d.content.items, a, b))}
          renderItem={(item, i) => (
            <>
              <TextField label="Título" value={item.title} onChange={(v) => update((d) => { d.content.items[i].title = v; }, `${block.id}:t:${item.id}`)} />
              {s.showImages && <MediaField label="Imagem" value={item.media} onChange={(m) => update((d) => { d.content.items[i].media = m; })} />}
            </>
          )} />
      </Section>
    </>
  );
}

export function FlashcardsInspector({ block, update }: BlockInspectorProps<FlashcardsContent, FlashcardsSettings>) {
  const s = block.settings;
  return (
    <>
      <Section title="Interação e layout">
        <Field label="Apresentação">
          <Segmented value={s.layout} onChange={(v) => update((d) => { d.settings.layout = v; })}
            options={[{ value: "grid", label: "Grade" }, { value: "stack", label: "Um por vez" }]} />
        </Field>
        {s.layout === "grid" && (
          <Field label="Colunas">
            <Segmented value={s.columns} onChange={(v) => update((d) => { d.settings.columns = v; })} options={[{ value: 2, label: "2" }, { value: 3, label: "3" }]} />
          </Field>
        )}
        <Field label="Altura do card">
          <Segmented value={s.height} onChange={(v) => update((d) => { d.settings.height = v; })}
            options={[{ value: "s", label: "P" }, { value: "m", label: "M" }, { value: "l", label: "G" }]} />
        </Field>
        <Field label="Estilo da frente">
          <Segmented value={s.frontStyle} onChange={(v) => update((d) => { d.settings.frontStyle = v; })}
            options={[{ value: "primary", label: "Cor primária" }, { value: "surface", label: "Neutro" }]} />
        </Field>
      </Section>
      <Section title="Cards">
        <ItemsField label="Cards" items={block.content.cards} getTitle={(c) => c.front}
          onAdd={() => update((d) => { d.content.cards.push({ id: uid("f"), front: "Novo termo", back: "Definição", frontMedia: null, backMedia: null }); })}
          onRemove={(i) => update((d) => { d.content.cards.splice(i, 1); })}
          onDuplicate={(i) => update((d) => { d.content.cards.splice(i + 1, 0, { ...d.content.cards[i], id: uid("f") }); })}
          onMove={(a, b) => update((d) => moveItem(d.content.cards, a, b))}
          renderItem={(card, i) => (
            <>
              <TextField label="Frente" multiline value={card.front} onChange={(v) => update((d) => { d.content.cards[i].front = v; }, `${block.id}:f:${card.id}`)} />
              <MediaField label="Imagem da frente (opcional)" value={card.frontMedia} onChange={(m) => update((d) => { d.content.cards[i].frontMedia = m; })} />
              <TextField label="Verso" multiline value={card.back} onChange={(v) => update((d) => { d.content.cards[i].back = v; }, `${block.id}:b:${card.id}`)} />
              <MediaField label="Imagem do verso (opcional)" value={card.backMedia} onChange={(m) => update((d) => { d.content.cards[i].backMedia = m; })} />
            </>
          )} />
      </Section>
    </>
  );
}

export function ProcessInspector({ block, update }: BlockInspectorProps<ProcessContent, ProcessSettings>) {
  const s = block.settings;
  return (
    <>
      <Section title="Estrutura">
        <ToggleField label="Tela de introdução" checked={s.showIntro} onChange={(v) => update((d) => { d.settings.showIntro = v; })} />
        <ToggleField label="Tela de resumo" checked={s.showSummary} onChange={(v) => update((d) => { d.settings.showSummary = v; })} />
        <ToggleField label="Numerar etapas" checked={s.numbered} onChange={(v) => update((d) => { d.settings.numbered = v; })} />
      </Section>
      <Section title="Etapas">
        <ItemsField label="Etapas" items={block.content.steps} getTitle={(st) => st.title} addLabel="Adicionar etapa"
          onAdd={() => update((d) => { d.content.steps.push({ id: uid("s"), title: `Etapa ${d.content.steps.length + 1}`, html: "<p>Descreva a etapa.</p>", media: null }); })}
          onRemove={(i) => update((d) => { d.content.steps.splice(i, 1); })}
          onDuplicate={(i) => update((d) => { d.content.steps.splice(i + 1, 0, { ...d.content.steps[i], id: uid("s") }); })}
          onMove={(a, b) => update((d) => moveItem(d.content.steps, a, b))}
          renderItem={(st, i) => (
            <>
              <TextField label="Título" value={st.title} onChange={(v) => update((d) => { d.content.steps[i].title = v; }, `${block.id}:st:${st.id}`)} />
              <MediaField label="Imagem (opcional)" value={st.media} onChange={(m) => update((d) => { d.content.steps[i].media = m; })} />
            </>
          )} />
      </Section>
    </>
  );
}
