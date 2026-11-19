"use client";
import { Field, Section, Segmented, TextField, ToggleField } from "../../editor-ui/fields";
import type { BlockInspectorProps } from "../../editor-ui/types";
import type { MatchingContent, MatchingSettings, OpenQuestionContent, OpenQuestionSettings, SortingContent, SortingSettings } from "./definitions";

type Graded = { attempts: 0 | 1 | 2 | 3; showCorrectAnswer: boolean; points: number };
type FeedbackContent = { feedbackCorrect: string; feedbackIncorrect: string };

function GradedInspector<C extends FeedbackContent, S extends Graded>({ block, update }: BlockInspectorProps<C, S>) {
  const s = block.settings;
  return (
    <>
      <Section title="Feedback">
        <TextField label="Feedback de acerto" multiline value={block.content.feedbackCorrect}
          onChange={(v) => update((d) => { d.content.feedbackCorrect = v; }, `${block.id}:fc`)} />
        <TextField label="Feedback de erro" multiline value={block.content.feedbackIncorrect}
          onChange={(v) => update((d) => { d.content.feedbackIncorrect = v; }, `${block.id}:fi`)} />
      </Section>
      <Section title="Comportamento">
        <Field label="Tentativas">
          <Segmented value={s.attempts} onChange={(v) => update((d) => { d.settings.attempts = v; })}
            options={[{ value: 0 as const, label: "Ilimitadas" }, { value: 1 as const, label: "1" }, { value: 2 as const, label: "2" }, { value: 3 as const, label: "3" }]} />
        </Field>
        <ToggleField label="Mostrar resposta correta" hint="Após esgotar as tentativas" checked={s.showCorrectAnswer}
          onChange={(v) => update((d) => { d.settings.showCorrectAnswer = v; })} />
        <Field label="Pontos" hint="Peso da atividade no resultado">
          <Segmented value={s.points} onChange={(v) => update((d) => { d.settings.points = v; })} options={[1, 2, 3, 5, 10].map((n) => ({ value: n, label: String(n) }))} />
        </Field>
      </Section>
    </>
  );
}

export const MatchingInspector = (p: BlockInspectorProps<MatchingContent, MatchingSettings>) => (
  <>
    <p className="px-4 pt-3 text-[11px] leading-relaxed text-ink-500">Pares são editados no canvas. Acertos parciais recebem pontuação proporcional.</p>
    <GradedInspector {...p} />
  </>
);

export const SortingInspector = (p: BlockInspectorProps<SortingContent, SortingSettings>) => (
  <>
    <p className="px-4 pt-3 text-[11px] leading-relaxed text-ink-500">Escreva os itens no canvas, na ordem correta. O aluno pode arrastar ou usar as setas (acessível por teclado).</p>
    <GradedInspector {...p} />
  </>
);

export function OpenQuestionInspector({ block, update }: BlockInspectorProps<OpenQuestionContent, OpenQuestionSettings>) {
  const s = block.settings;
  return (
    <Section title="Resposta">
      <TextField label="Texto de apoio do campo" value={block.content.placeholder} onChange={(v) => update((d) => { d.content.placeholder = v; }, `${block.id}:ph`)} />
      <Field label="Tamanho mínimo">
        <Segmented value={s.minLength} onChange={(v) => update((d) => { d.settings.minLength = v; })}
          options={[0, 20, 50, 100, 200].map((n) => ({ value: n, label: n ? String(n) : "Livre" }))} />
      </Field>
      <ToggleField label="Mostrar resposta de referência" hint="Exibida após o envio" checked={s.showModelAnswer}
        onChange={(v) => update((d) => { d.settings.showModelAnswer = v; })} />
      <p className="text-[11px] leading-relaxed text-ink-500">Perguntas abertas não recebem nota: contam como atividade concluída quando o aluno envia a resposta.</p>
    </Section>
  );
}
