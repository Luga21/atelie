"use client";
import { useMemo, useState } from "react";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { uid } from "@/core/model/ids";
import { EditableText, RichText } from "../../common/Editable";
import { useActivityReporter, type BlockViewProps } from "../../engine/context";
import {
  evaluateMatching, type MatchingContent, type MatchingSettings, type OpenQuestionContent, type OpenQuestionSettings,
  type SortingContent, type SortingSettings,
} from "./definitions";

function shuffle<T>(arr: T[], avoidSameOrder = false): T[] {
  const a = [...arr];
  for (let n = 0; n < 6; n++) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    if (!avoidSameOrder || a.length < 2 || a.some((x, i) => x !== arr[i])) break;
  }
  return a;
}

/** Retorno comum das atividades avaliadas. */
function GradedFeedback({ correct, exhausted, message, attempts, maxAttempts, detail }: {
  correct: boolean;
  exhausted: boolean;
  message: string;
  attempts: number;
  maxAttempts: number;
  detail?: string;
}) {
  return (
    <div className={`cr-feedback ${correct ? "is-correct" : "is-incorrect"}`} role="status">
      <strong>{correct ? "Correto" : exhausted ? "Resposta incorreta" : "Ainda não"}</strong>
      <p>{message}</p>
      {detail && <p className="cr-feedback-meta">{detail}</p>}
      {maxAttempts > 0 && !correct && <p className="cr-feedback-meta">Tentativa {attempts} de {maxAttempts}</p>}
    </div>
  );
}

/* ------------------------------------------------- Associação de colunas */
const PAIR_COLORS = 6;

export function MatchingView(props: BlockViewProps<MatchingContent, MatchingSettings>) {
  return props.mode === "edit" ? <MatchingEditor {...props} /> : <MatchingPlayer {...props} />;
}

function MatchingEditor({ block, update }: BlockViewProps<MatchingContent, MatchingSettings>) {
  const c = block.content;
  const set = (fn: (d: MatchingContent) => void, key?: string) => update?.((d) => fn(d.content), key);
  return (
    <div className="cr-quiz is-editing">
      <span className="cr-eyebrow">Associação de colunas</span>
      <RichText html={c.prompt} editable className="cr-quiz-question" placeholder="Enunciado…" onChange={(v) => set((d) => { d.prompt = v; }, `${block.id}:q`)} />
      <div className="cr-match-edit">
        <span className="cr-match-head">Item</span><span /><span className="cr-match-head">Correspondente correto</span><span />
        {c.pairs.map((p, i) => (
          <div key={p.id} className="cr-match-edit-row">
            <EditableText className="cr-match-cell" value={p.left} editable placeholder="Item" onChange={(v) => set((d) => { d.pairs[i].left = v; }, `${block.id}:l:${p.id}`)} />
            <span className="cr-match-arrow" aria-hidden>↔</span>
            <EditableText className="cr-match-cell" value={p.right} editable placeholder="Correspondente" onChange={(v) => set((d) => { d.pairs[i].right = v; }, `${block.id}:r:${p.id}`)} />
            {c.pairs.length > 2 ? (
              <button type="button" className="cr-option-remove" aria-label="Remover par" onClick={() => set((d) => { d.pairs.splice(i, 1); })}>×</button>
            ) : <span />}
          </div>
        ))}
      </div>
      <button type="button" className="cr-inline-add" onClick={() => set((d) => { d.pairs.push({ id: uid("p"), left: "Novo item", right: "Correspondente" }); })}>+ Adicionar par</button>
      <p className="cr-edit-hint">Escreva os pares corretos. Para o aluno, a coluna da direita aparece embaralhada.</p>
    </div>
  );
}

function MatchingPlayer({ block }: BlockViewProps<MatchingContent, MatchingSettings>) {
  const c = block.content;
  const s = block.settings;
  const reporter = useActivityReporter();
  const saved = reporter?.get(block.id);
  const rights = useMemo(() => shuffle(c.pairs, true), [c.pairs]);

  const [answer, setAnswer] = useState<Record<string, string>>(() =>
    Object.fromEntries((saved?.response ?? []).map((r) => r.split("→"))),
  );
  const [picked, setPicked] = useState<{ side: "left" | "right"; id: string } | null>(null);
  // Esquerda e direita compartilham o id do par; comparar só o id destacaria a resposta correta.
  const isPicked = (side: "left" | "right", id: string) => picked?.side === side && picked.id === id;
  const [submitted, setSubmitted] = useState(!!saved && saved.attempts > 0);
  const [attempts, setAttempts] = useState(saved?.attempts ?? 0);

  const evaluation = evaluateMatching(c, answer);
  const allCorrect = evaluation.correct === evaluation.total;
  const exhausted = s.attempts > 0 && attempts >= s.attempts;
  const reveal = submitted && !allCorrect && exhausted && s.showCorrectAnswer;
  const colorOf = (leftId: string) => (c.pairs.findIndex((p) => p.id === leftId) % PAIR_COLORS) + 1;
  const leftForRight = (rightId: string) => Object.keys(answer).find((l) => answer[l] === rightId);

  const connect = (leftId: string, rightId: string) => {
    setAnswer((a) => {
      const next = { ...a };
      for (const k of Object.keys(next)) if (next[k] === rightId) delete next[k];
      next[leftId] = rightId;
      return next;
    });
    setPicked(null);
  };

  const clickLeft = (id: string) => {
    if (submitted) return;
    if (picked?.side === "right") return connect(id, picked.id);
    setPicked(isPicked("left", id) ? null : { side: "left", id });
  };
  const clickRight = (id: string) => {
    if (submitted) return;
    if (picked?.side === "left") return connect(picked.id, id);
    setPicked(isPicked("right", id) ? null : { side: "right", id });
  };

  const submit = () => {
    const n = attempts + 1;
    setAttempts(n);
    setSubmitted(true);
    reporter?.report(block.id, {
      score: Math.round((s.points * evaluation.correct * 100) / evaluation.total) / 100,
      maxScore: s.points,
      passed: allCorrect,
      attempts: n,
      response: Object.entries(answer).map(([l, r]) => `${l}→${r}`),
      completed: allCorrect || (s.attempts > 0 && n >= s.attempts),
    });
  };

  const retry = () => {
    // Mantém os pares corretos e libera os incorretos.
    setAnswer((a) => Object.fromEntries(Object.entries(a).filter(([l, r]) => l === r)));
    setSubmitted(false);
  };

  const complete = Object.keys(answer).length === c.pairs.length;

  return (
    <div className="cr-quiz" data-state={submitted ? (allCorrect ? "correct" : "incorrect") : "open"}>
      <span className="cr-eyebrow">Associe os itens</span>
      <RichText html={c.prompt} editable={false} className="cr-quiz-question" />
      <p className="cr-match-help">Selecione um item à esquerda e depois o correspondente à direita.</p>
      <div className="cr-match">
        <ul className="cr-match-col" aria-label="Itens">
          {c.pairs.map((p, i) => {
            const linked = answer[p.id];
            const state = submitted ? (linked === p.id ? "is-right" : "is-wrong") : "";
            return (
              <li key={p.id}>
                <button type="button" disabled={submitted} aria-pressed={isPicked("left", p.id)}
                  className={`cr-match-item ${isPicked("left", p.id) ? "is-picked" : ""} ${linked ? `is-linked c${colorOf(p.id)}` : ""} ${state}`}
                  onClick={() => clickLeft(p.id)}>
                  <span className="cr-match-badge">{i + 1}</span>
                  <span className="cr-match-label">{p.left}</span>
                </button>
                {reveal && linked !== p.id && <span className="cr-match-answer">Correto: {p.right}</span>}
              </li>
            );
          })}
        </ul>
        <ul className="cr-match-col" aria-label="Correspondentes">
          {rights.map((p) => {
            const leftId = leftForRight(p.id);
            const leftIndex = leftId ? c.pairs.findIndex((x) => x.id === leftId) : -1;
            const state = submitted && leftId ? (leftId === p.id ? "is-right" : "is-wrong") : "";
            return (
              <li key={p.id}>
                <button type="button" disabled={submitted} aria-pressed={isPicked("right", p.id)}
                  className={`cr-match-item is-right-col ${isPicked("right", p.id) ? "is-picked" : ""} ${leftId ? `is-linked c${colorOf(leftId)}` : ""} ${state}`}
                  onClick={() => clickRight(p.id)}>
                  <span className="cr-match-badge">{leftIndex >= 0 ? leftIndex + 1 : ""}</span>
                  <span className="cr-match-label">{p.right}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      {submitted && (
        <GradedFeedback correct={allCorrect} exhausted={exhausted} attempts={attempts} maxAttempts={s.attempts}
          message={allCorrect ? c.feedbackCorrect : c.feedbackIncorrect}
          detail={allCorrect ? undefined : `${evaluation.correct} de ${evaluation.total} associações corretas.`} />
      )}
      <div className="cr-quiz-actions">
        {!submitted && <button type="button" className="cr-btn" disabled={!complete} onClick={submit}>Verificar</button>}
        {!submitted && Object.keys(answer).length > 0 && (
          <button type="button" className="cr-btn cr-btn--ghost" onClick={() => { setAnswer({}); setPicked(null); }}>Limpar</button>
        )}
        {submitted && !allCorrect && !exhausted && <button type="button" className="cr-btn" onClick={retry}>↺ Tentar novamente</button>}
      </div>
    </div>
  );
}

/* ------------------------------------------------ Ordenar (arrastar e soltar) */
export function SortingView(props: BlockViewProps<SortingContent, SortingSettings>) {
  return props.mode === "edit" ? <SortingEditor {...props} /> : <SortingPlayer {...props} />;
}

function SortingEditor({ block, update }: BlockViewProps<SortingContent, SortingSettings>) {
  const c = block.content;
  const set = (fn: (d: SortingContent) => void, key?: string) => update?.((d) => fn(d.content), key);
  return (
    <div className="cr-quiz is-editing">
      <span className="cr-eyebrow">Ordenar · sequência correta</span>
      <RichText html={c.prompt} editable className="cr-quiz-question" placeholder="Enunciado…" onChange={(v) => set((d) => { d.prompt = v; }, `${block.id}:q`)} />
      <ol className="cr-sort-list">
        {c.items.map((it, i) => (
          <li key={it.id} className="cr-sort-item">
            <span className="cr-match-badge">{i + 1}</span>
            <EditableText className="cr-option-text" value={it.text} editable placeholder="Item" onChange={(v) => set((d) => { d.items[i].text = v; }, `${block.id}:i:${it.id}`)} />
            <button type="button" className="cr-option-remove" aria-label="Mover para cima" disabled={i === 0}
              onClick={() => set((d) => { d.items.splice(i - 1, 0, d.items.splice(i, 1)[0]); })}>↑</button>
            {c.items.length > 2 && <button type="button" className="cr-option-remove" aria-label="Remover item" onClick={() => set((d) => { d.items.splice(i, 1); })}>×</button>}
          </li>
        ))}
      </ol>
      <button type="button" className="cr-inline-add" onClick={() => set((d) => { d.items.push({ id: uid("s"), text: "Novo item" }); })}>+ Adicionar item</button>
      <p className="cr-edit-hint">Escreva os itens na ordem correta. O aluno os verá embaralhados.</p>
    </div>
  );
}

function SortableRow({ id, text, index, total, state, locked, onMove }: {
  id: string; text: string; index: number; total: number; state: string; locked: boolean; onMove: (from: number, to: number) => void;
}) {
  const s = useSortable({ id, disabled: locked });
  return (
    <li ref={s.setNodeRef} style={{ transform: CSS.Translate.toString(s.transform), transition: s.transition }}
      className={`cr-sort-item is-player ${s.isDragging ? "is-dragging" : ""} ${state}`}>
      <button type="button" className="cr-sort-handle" aria-label={`Arrastar: ${text}`} disabled={locked} {...s.attributes} {...s.listeners}>⋮⋮</button>
      <span className="cr-match-badge">{index + 1}</span>
      <span className="cr-option-text">{text}</span>
      {!locked && (
        <span className="cr-sort-arrows">
          <button type="button" aria-label="Mover para cima" disabled={index === 0} onClick={() => onMove(index, index - 1)}>↑</button>
          <button type="button" aria-label="Mover para baixo" disabled={index === total - 1} onClick={() => onMove(index, index + 1)}>↓</button>
        </span>
      )}
      {state === "is-right" && <span className="cr-sort-mark" aria-label="Posição correta">✓</span>}
      {state === "is-wrong" && <span className="cr-sort-mark" aria-label="Posição incorreta">✕</span>}
    </li>
  );
}

function SortingPlayer({ block }: BlockViewProps<SortingContent, SortingSettings>) {
  const c = block.content;
  const s = block.settings;
  const reporter = useActivityReporter();
  const saved = reporter?.get(block.id);
  const [order, setOrder] = useState<string[]>(() =>
    saved?.response?.length === c.items.length ? saved.response : shuffle(c.items, true).map((i) => i.id),
  );
  const [submitted, setSubmitted] = useState(!!saved && saved.attempts > 0);
  const [attempts, setAttempts] = useState(saved?.attempts ?? 0);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const byId = Object.fromEntries(c.items.map((i) => [i.id, i]));
  const positions = order.map((id, i) => c.items[i]?.id === id);
  const correctCount = positions.filter(Boolean).length;
  const allCorrect = correctCount === c.items.length;
  const exhausted = s.attempts > 0 && attempts >= s.attempts;
  const reveal = submitted && !allCorrect && exhausted && s.showCorrectAnswer;

  const move = (from: number, to: number) => setOrder((o) => arrayMove(o, from, to));
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    move(order.indexOf(String(active.id)), order.indexOf(String(over.id)));
  };

  const submit = () => {
    const n = attempts + 1;
    setAttempts(n);
    setSubmitted(true);
    reporter?.report(block.id, {
      score: allCorrect ? s.points : 0,
      maxScore: s.points,
      passed: allCorrect,
      attempts: n,
      response: order,
      completed: allCorrect || (s.attempts > 0 && n >= s.attempts),
    });
  };

  return (
    <div className="cr-quiz" data-state={submitted ? (allCorrect ? "correct" : "incorrect") : "open"}>
      <span className="cr-eyebrow">Coloque na ordem correta</span>
      <RichText html={c.prompt} editable={false} className="cr-quiz-question" />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <ol className="cr-sort-list">
            {order.map((id, i) => (
              <SortableRow key={id} id={id} text={byId[id]?.text ?? ""} index={i} total={order.length} locked={submitted}
                state={submitted ? (positions[i] ? "is-right" : "is-wrong") : ""} onMove={move} />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      {reveal && (
        <div className="cr-sort-answer">
          <strong>Ordem correta</strong>
          <ol>{c.items.map((it) => <li key={it.id}>{it.text}</li>)}</ol>
        </div>
      )}
      {submitted && (
        <GradedFeedback correct={allCorrect} exhausted={exhausted} attempts={attempts} maxAttempts={s.attempts}
          message={allCorrect ? c.feedbackCorrect : c.feedbackIncorrect}
          detail={allCorrect ? undefined : `${correctCount} de ${c.items.length} itens na posição correta.`} />
      )}
      <div className="cr-quiz-actions">
        {!submitted && <button type="button" className="cr-btn" onClick={submit}>Verificar ordem</button>}
        {submitted && !allCorrect && !exhausted && <button type="button" className="cr-btn" onClick={() => setSubmitted(false)}>↺ Tentar novamente</button>}
      </div>
    </div>
  );
}

/* -------------------------------------------------------- Pergunta aberta */
export function OpenQuestionView({ block, mode, update }: BlockViewProps<OpenQuestionContent, OpenQuestionSettings>) {
  const c = block.content;
  const s = block.settings;
  const reporter = useActivityReporter();
  const saved = reporter?.get(block.id);
  const [text, setText] = useState(saved?.response?.[0] ?? "");
  const [submitted, setSubmitted] = useState(!!saved?.completed);

  if (mode === "edit") {
    const set = (fn: (d: OpenQuestionContent) => void, key?: string) => update?.((d) => fn(d.content), key);
    return (
      <div className="cr-quiz is-editing">
        <span className="cr-eyebrow">Pergunta aberta</span>
        <RichText html={c.question} editable className="cr-quiz-question" placeholder="Pergunta…" onChange={(v) => set((d) => { d.question = v; }, `${block.id}:q`)} />
        <div className="cr-open-input is-preview">{c.placeholder || "Área de resposta do aluno"}</div>
        {s.showModelAnswer && (
          <div className="cr-open-model">
            <strong>Resposta de referência (mostrada após o envio)</strong>
            <RichText html={c.modelAnswer} editable placeholder="Uma boa resposta…" onChange={(v) => set((d) => { d.modelAnswer = v; }, `${block.id}:m`)} />
          </div>
        )}
      </div>
    );
  }

  const tooShort = text.trim().length < s.minLength;
  return (
    <div className="cr-quiz" data-state={submitted ? "correct" : "open"}>
      <span className="cr-eyebrow">Reflita e responda</span>
      <RichText html={c.question} editable={false} className="cr-quiz-question" />
      <label className="cr-sr-only" htmlFor={`${block.id}-answer`}>Sua resposta</label>
      <textarea id={`${block.id}-answer`} className="cr-open-input" value={text} placeholder={c.placeholder} rows={5}
        readOnly={submitted} onChange={(e) => setText(e.target.value)} />
      {!submitted && (
        <p className="cr-open-count">{tooShort ? `Escreva pelo menos ${s.minLength} caracteres (${text.trim().length}/${s.minLength})` : `${text.trim().length} caracteres`}</p>
      )}
      {submitted && (
        <div className="cr-feedback is-correct" role="status">
          <strong>Resposta registrada</strong>
          <p>Compare sua resposta com a referência abaixo.</p>
        </div>
      )}
      {submitted && s.showModelAnswer && c.modelAnswer && (
        <div className="cr-open-model">
          <strong>Resposta de referência</strong>
          <RichText html={c.modelAnswer} editable={false} />
        </div>
      )}
      <div className="cr-quiz-actions">
        {!submitted ? (
          <button type="button" className="cr-btn" disabled={tooShort} onClick={() => {
            setSubmitted(true);
            reporter?.report(block.id, { score: 0, maxScore: 0, passed: true, attempts: (saved?.attempts ?? 0) + 1, response: [text], completed: true });
          }}>Enviar resposta</button>
        ) : (
          <button type="button" className="cr-btn cr-btn--ghost" onClick={() => setSubmitted(false)}>Editar resposta</button>
        )}
      </div>
    </div>
  );
}
