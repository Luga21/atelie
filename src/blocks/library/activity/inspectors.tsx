"use client";
import { uid } from "@/core/model/ids";
import { Field, ItemsField, moveItem, Section, Segmented, TextField, ToggleField } from "../../editor-ui/fields";
import type { BlockInspectorProps } from "../../editor-ui/types";
import { Switch } from "@/ui/primitives";
import { CHOICE_MODE, type ChoiceContent, type ChoiceSettings } from "./definitions";

export function ChoiceInspector({ block, update }: BlockInspectorProps<ChoiceContent, ChoiceSettings>) {
  const mode = CHOICE_MODE[block.type] ?? "single";
  const s = block.settings;
  const c = block.content;
  const correctCount = c.options.filter((o) => o.correct).length;

  const setCorrect = (i: number, value: boolean) =>
    update((d) => {
      if (mode === "multiple") d.content.options[i].correct = value;
      else d.content.options.forEach((o, j) => (o.correct = j === i));
    });

  return (
    <>
      {correctCount === 0 && (
        <div className="mx-4 mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200">
          Marque ao menos uma alternativa correta.
        </div>
      )}
      <Section title="Alternativas e feedback">
        <ItemsField label="Alternativas" items={c.options} min={2} addLabel="Adicionar alternativa" canAdd={mode !== "truefalse"}
          getTitle={(o) => `${o.correct ? "✓ " : ""}${o.text}`}
          onAdd={() => update((d) => { d.content.options.push({ id: uid("o"), text: "Nova alternativa", correct: false, feedback: "" }); })}
          onRemove={(i) => mode !== "truefalse" && update((d) => { d.content.options.splice(i, 1); })}
          onMove={(a, b) => update((d) => moveItem(d.content.options, a, b))}
          renderItem={(o, i) => (
            <>
              {mode !== "truefalse" && (
                <TextField label="Texto" value={o.text} onChange={(v) => update((d) => { d.content.options[i].text = v; }, `${block.id}:o:${o.id}`)} />
              )}
              <Field label="Resposta correta" inline>
                <Switch checked={o.correct} onChange={(v) => setCorrect(i, v)} label="Resposta correta" />
              </Field>
              <TextField label="Explicação desta alternativa" multiline hint="Mostrada quando o aluno escolhe esta opção"
                value={o.feedback} onChange={(v) => update((d) => { d.content.options[i].feedback = v; }, `${block.id}:ofb:${o.id}`)} />
            </>
          )} />
        <TextField label="Feedback de acerto" multiline value={c.feedbackCorrect} onChange={(v) => update((d) => { d.content.feedbackCorrect = v; }, `${block.id}:fc`)} />
        <TextField label="Feedback de erro" multiline value={c.feedbackIncorrect} onChange={(v) => update((d) => { d.content.feedbackIncorrect = v; }, `${block.id}:fi`)} />
      </Section>
      <Section title="Comportamento">
        <Field label="Tentativas">
          <Segmented value={s.attempts} onChange={(v) => update((d) => { d.settings.attempts = v; })}
            options={[{ value: 0, label: "Ilimitadas" }, { value: 1, label: "1" }, { value: 2, label: "2" }, { value: 3, label: "3" }]} />
        </Field>
        {mode !== "truefalse" && (
          <ToggleField label="Embaralhar alternativas" checked={s.shuffle} onChange={(v) => update((d) => { d.settings.shuffle = v; })} />
        )}
        <ToggleField label="Mostrar resposta correta" hint="Após esgotar as tentativas" checked={s.showCorrectAnswer} onChange={(v) => update((d) => { d.settings.showCorrectAnswer = v; })} />
        <ToggleField label="Explicação por alternativa" checked={s.showOptionFeedback} onChange={(v) => update((d) => { d.settings.showOptionFeedback = v; })} />
        <Field label="Pontos" hint="Peso da atividade no resultado do treinamento">
          <Segmented value={s.points} onChange={(v) => update((d) => { d.settings.points = v; })}
            options={[1, 2, 3, 5, 10].map((n) => ({ value: n, label: String(n) }))} />
        </Field>
      </Section>
    </>
  );
}
