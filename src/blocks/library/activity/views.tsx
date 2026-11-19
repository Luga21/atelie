"use client";
import { useMemo, useState } from "react";
import { uid } from "@/core/model/ids";
import { EditableText, RichText } from "../../common/Editable";
import { useActivityReporter, type BlockViewProps } from "../../engine/context";
import { CHOICE_MODE, evaluateChoice, type ChoiceContent, type ChoiceSettings } from "./definitions";

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const LABEL = { single: "Escolha uma alternativa", multiple: "Selecione todas as alternativas corretas", truefalse: "Verdadeiro ou falso?" };

/** Renderizador compartilhado pelos três tipos de atividade de escolha. */
export function ChoiceView(props: BlockViewProps<ChoiceContent, ChoiceSettings>) {
  return props.mode === "edit" ? <ChoiceEditor {...props} /> : <ChoicePlayer {...props} />;
}

/* ------------------------------------------------------------ Modo edição */
function ChoiceEditor({ block, update }: BlockViewProps<ChoiceContent, ChoiceSettings>) {
  const mode = CHOICE_MODE[block.type] ?? "single";
  const c = block.content;
  const set = (fn: (d: ChoiceContent) => void, key?: string) => update?.((d) => fn(d.content), key);

  const toggleCorrect = (i: number) =>
    set((d) => {
      if (mode === "multiple") d.options[i].correct = !d.options[i].correct;
      else d.options.forEach((o, j) => (o.correct = j === i));
    });

  return (
    <div className="cr-quiz is-editing">
      <span className="cr-eyebrow">{LABEL[mode]}</span>
      <RichText html={c.question} editable placeholder="Enunciado da pergunta…" className="cr-quiz-question"
        onChange={(v) => set((d) => { d.question = v; }, `${block.id}:q`)} />
      <ul className="cr-quiz-options" data-mode={mode}>
        {c.options.map((o, i) => (
          <li key={o.id} className={`cr-option ${o.correct ? "is-key" : ""}`}>
            <button type="button" className="cr-option-mark" onClick={() => toggleCorrect(i)}
              title={o.correct ? "Resposta correta" : "Marcar como correta"} aria-pressed={o.correct}>
              {o.correct ? "✓" : ""}
            </button>
            <EditableText value={o.text} editable={mode !== "truefalse"} placeholder="Texto da alternativa" className="cr-option-text"
              onChange={(v) => set((d) => { d.options[i].text = v; }, `${block.id}:o:${o.id}`)} />
            {mode !== "truefalse" && c.options.length > 2 && (
              <button type="button" className="cr-option-remove" aria-label="Remover alternativa"
                onClick={() => set((d) => { d.options.splice(i, 1); })}>×</button>
            )}
          </li>
        ))}
      </ul>
      {mode !== "truefalse" && (
        <button type="button" className="cr-inline-add" onClick={() => set((d) => {
          d.options.push({ id: uid("o"), text: "Nova alternativa", correct: false, feedback: "" });
        })}>+ Adicionar alternativa</button>
      )}
      <div className="cr-quiz-edit-feedback">
        <div className="cr-feedback is-correct">
          <strong>Feedback de acerto</strong>
          <EditableText as="p" value={c.feedbackCorrect} editable multiline placeholder="Mensagem quando acertar"
            onChange={(v) => set((d) => { d.feedbackCorrect = v; }, `${block.id}:fc`)} />
        </div>
        <div className="cr-feedback is-incorrect">
          <strong>Feedback de erro</strong>
          <EditableText as="p" value={c.feedbackIncorrect} editable multiline placeholder="Mensagem quando errar"
            onChange={(v) => set((d) => { d.feedbackIncorrect = v; }, `${block.id}:fi`)} />
        </div>
      </div>
      <p className="cr-edit-hint">Clique no círculo para marcar a(s) resposta(s) correta(s). Explicações por alternativa ficam no painel lateral.</p>
    </div>
  );
}

/* -------------------------------------------------------- Modo aluno */
function ChoicePlayer({ block }: BlockViewProps<ChoiceContent, ChoiceSettings>) {
  const mode = CHOICE_MODE[block.type] ?? "single";
  const c = block.content;
  const s = block.settings;
  const reporter = useActivityReporter();
  const saved = reporter?.get(block.id);

  const options = useMemo(() => (s.shuffle ? shuffled(c.options) : c.options), [c.options, s.shuffle]);
  const [selected, setSelected] = useState<string[]>(saved?.response ?? []);
  const [submitted, setSubmitted] = useState(!!saved && saved.attempts > 0);
  const [attempts, setAttempts] = useState(saved?.attempts ?? 0);
  const isCorrect = submitted && evaluateChoice(c, selected);
  const exhausted = s.attempts > 0 && attempts >= s.attempts;
  const canRetry = submitted && !isCorrect && !exhausted;
  const revealKey = submitted && (isCorrect || (exhausted && s.showCorrectAnswer));

  const choose = (id: string) => {
    if (submitted) return;
    setSelected((cur) => (mode === "multiple" ? (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]) : [id]));
  };

  const submit = () => {
    const correct = evaluateChoice(c, selected);
    const n = attempts + 1;
    setAttempts(n);
    setSubmitted(true);
    reporter?.report(block.id, {
      score: correct ? s.points : 0,
      maxScore: s.points,
      passed: correct,
      attempts: n,
      response: selected,
      completed: correct || (s.attempts > 0 && n >= s.attempts),
    });
  };

  const retry = () => {
    setSubmitted(false);
    setSelected([]);
  };

  const inputType = mode === "multiple" ? "checkbox" : "radio";
  const chosenFeedback = s.showOptionFeedback
    ? c.options.filter((o) => selected.includes(o.id) && o.feedback.trim())
    : [];

  return (
    <div className="cr-quiz" data-state={submitted ? (isCorrect ? "correct" : "incorrect") : "open"}>
      <span className="cr-eyebrow">{LABEL[mode]}</span>
      <RichText html={c.question} editable={false} className="cr-quiz-question" />
      <ul className="cr-quiz-options" data-mode={mode} role={mode === "multiple" ? "group" : "radiogroup"}>
        {options.map((o) => {
          const checked = selected.includes(o.id);
          const status = revealKey ? (o.correct ? "is-right" : checked ? "is-wrong" : "") : submitted && checked ? (isCorrect ? "is-right" : "is-wrong") : "";
          return (
            <li key={o.id}>
              <label className={`cr-option is-selectable ${checked ? "is-checked" : ""} ${status} ${submitted ? "is-locked" : ""}`}>
                <input type={inputType} name={block.id} checked={checked} disabled={submitted} onChange={() => choose(o.id)} />
                <span className="cr-option-mark" aria-hidden>{status === "is-right" ? "✓" : status === "is-wrong" ? "✕" : ""}</span>
                <span className="cr-option-text">{o.text}</span>
              </label>
            </li>
          );
        })}
      </ul>

      {submitted && (
        <div className={`cr-feedback ${isCorrect ? "is-correct" : "is-incorrect"}`} role="status">
          <strong>{isCorrect ? "Correto" : exhausted ? "Resposta incorreta" : "Incorreto"}</strong>
          <p>{isCorrect ? c.feedbackCorrect : c.feedbackIncorrect}</p>
          {chosenFeedback.map((o) => (
            <p key={o.id} className="cr-feedback-detail"><em>{o.text}:</em> {o.feedback}</p>
          ))}
          {s.attempts > 0 && !isCorrect && (
            <p className="cr-feedback-meta">Tentativa {attempts} de {s.attempts}{exhausted && s.showCorrectAnswer ? " · a resposta correta está destacada" : ""}</p>
          )}
        </div>
      )}

      <div className="cr-quiz-actions">
        {!submitted && (
          <button type="button" className="cr-btn" disabled={selected.length === 0} onClick={submit}>Enviar resposta</button>
        )}
        {canRetry && <button type="button" className="cr-btn" onClick={retry}>↺ Tentar novamente</button>}
      </div>
    </div>
  );
}
