"use client";
import { useState } from "react";
import { uid } from "@/core/model/ids";
import { EditableText, RichText } from "../../common/Editable";
import { MediaImage } from "../../common/Media";
import { useActivityReporter, useLessonScope, type BlockViewProps } from "../../engine/context";
import {
  createScene, END, type GateContent, type GateSettings, type PerformanceContent, type PerformanceSettings,
  type ScenarioContent, type ScenarioScene, type ScenarioSettings,
} from "./definitions";

const OUTCOME = {
  success: { label: "Desfecho positivo", icon: "✓" },
  neutral: { label: "Desfecho neutro", icon: "•" },
  failure: { label: "Desfecho negativo", icon: "✕" },
} as const;

/* ------------------------------------------------------ Cenário ramificado */
export function ScenarioView(props: BlockViewProps<ScenarioContent, ScenarioSettings>) {
  return props.mode === "edit" ? <ScenarioEditor {...props} /> : <ScenarioPlayer {...props} />;
}

function ScenarioEditor({ block, update }: BlockViewProps<ScenarioContent, ScenarioSettings>) {
  const c = block.content;
  const [sceneId, setSceneId] = useState(c.startSceneId);
  const index = Math.max(0, c.scenes.findIndex((s) => s.id === sceneId));
  const scene = c.scenes[index];
  const set = (fn: (d: ScenarioContent) => void, key?: string) => update?.((d) => fn(d.content), key);
  const sceneName = (s: ScenarioScene, i: number) => `${i + 1}. ${s.title || "Sem título"}`;

  return (
    <div className="cr-scenario is-editing">
      <EditableText as="h3" className="cr-h" value={c.title} editable placeholder="Título do cenário" onChange={(v) => set((d) => { d.title = v; }, `${block.id}:title`)} />
      <EditableText as="p" className="cr-scenario-intro" value={c.intro} editable placeholder="Introdução (opcional)" onChange={(v) => set((d) => { d.intro = v; }, `${block.id}:intro`)} />

      <div className="cr-scene-tabs" role="tablist" aria-label="Cenas">
        {c.scenes.map((s, i) => (
          <button key={s.id} type="button" role="tab" aria-selected={s.id === scene?.id} onClick={() => setSceneId(s.id)}
            className={`cr-scene-tab ${s.id === scene?.id ? "is-active" : ""} ${s.choices.length === 0 ? `is-end is-${s.outcome}` : ""}`}>
            {s.id === c.startSceneId && <span className="cr-scene-flag">Início</span>}
            {s.choices.length === 0 && <span className="cr-scene-flag">{OUTCOME[s.outcome].icon} Final</span>}
            <span className="cr-scene-tab-title">{sceneName(s, i)}</span>
          </button>
        ))}
        <button type="button" className="cr-scene-tab is-add" onClick={() => {
          const s = createScene(`Cena ${c.scenes.length + 1}`);
          set((d) => { d.scenes.push(s); });
          setSceneId(s.id);
        }}>+ Cena</button>
      </div>

      {scene && (
        <div className="cr-scene-card" key={scene.id}>
          {scene.media && <MediaImage media={scene.media} alt="" mode="view" className="cr-scene-img" />}
          <EditableText as="h4" className="cr-h" value={scene.title} editable placeholder="Título da cena"
            onChange={(v) => set((d) => { d.scenes[index].title = v; }, `${block.id}:st:${scene.id}`)} />
          <RichText html={scene.html} editable placeholder="Descreva a situação…"
            onChange={(v) => set((d) => { d.scenes[index].html = v; }, `${block.id}:sh:${scene.id}`)} />

          {scene.choices.length > 0 ? (
            <div className="cr-choice-edit-list">
              <span className="cr-eyebrow">Escolhas</span>
              {scene.choices.map((ch, ci) => (
                <div key={ch.id} className="cr-choice-edit">
                  <div className="cr-choice-edit-main">
                    <EditableText className="cr-choice-edit-text" value={ch.text} editable placeholder="Texto da escolha"
                      onChange={(v) => set((d) => { d.scenes[index].choices[ci].text = v; }, `${block.id}:ct:${ch.id}`)} />
                    <button type="button" className="cr-option-remove" aria-label="Remover escolha" onClick={() => set((d) => { d.scenes[index].choices.splice(ci, 1); })}>×</button>
                  </div>
                  <EditableText as="p" className="cr-choice-edit-feedback" value={ch.feedback} editable multiline placeholder="Feedback/consequência imediata (opcional)"
                    onChange={(v) => set((d) => { d.scenes[index].choices[ci].feedback = v; }, `${block.id}:cf:${ch.id}`)} />
                  <label className="cr-choice-target">
                    <span>Leva para</span>
                    <select value={c.scenes.some((s) => s.id === ch.target) ? ch.target : END}
                      onChange={(e) => set((d) => { d.scenes[index].choices[ci].target = e.target.value; })}>
                      {c.scenes.map((s, si) => s.id !== scene.id && <option key={s.id} value={s.id}>{sceneName(s, si)}</option>)}
                      <option value={END}>Encerrar o cenário</option>
                    </select>
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <div className="cr-scene-ending">
              <span className="cr-eyebrow">Cena final · desfecho</span>
              <div className="cr-outcome-picker" role="radiogroup" aria-label="Desfecho">
                {(Object.keys(OUTCOME) as ScenarioScene["outcome"][]).map((o) => (
                  <button key={o} type="button" role="radio" aria-checked={scene.outcome === o}
                    className={`cr-outcome is-${o} ${scene.outcome === o ? "is-active" : ""}`}
                    onClick={() => set((d) => { d.scenes[index].outcome = o; })}>
                    {OUTCOME[o].icon} {OUTCOME[o].label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button type="button" className="cr-inline-add" onClick={() => set((d) => {
            d.scenes[index].choices.push({ id: uid("ch"), text: "Nova escolha", feedback: "", target: END });
          })}>+ Adicionar escolha</button>
          {scene.choices.length === 0 && <p className="cr-edit-hint">Cenas sem escolhas encerram o cenário. Um desfecho positivo vale a pontuação do bloco.</p>}
        </div>
      )}
    </div>
  );
}

function ScenarioPlayer({ block }: BlockViewProps<ScenarioContent, ScenarioSettings>) {
  const c = block.content;
  const s = block.settings;
  const reporter = useActivityReporter();
  const [sceneId, setSceneId] = useState<string | null>(null); // null = introdução
  const [pending, setPending] = useState<{ feedback: string; target: string } | null>(null);
  const [path, setPath] = useState<string[]>([]);
  const [ended, setEnded] = useState<ScenarioScene | "end" | null>(null);
  const [attempts, setAttempts] = useState(reporter?.get(block.id)?.attempts ?? 0);

  const scene = c.scenes.find((x) => x.id === sceneId);

  const finish = (sc: ScenarioScene | "end", choices: string[]) => {
    setEnded(sc);
    const outcome = sc === "end" ? "neutral" : sc.outcome;
    const n = attempts + 1;
    setAttempts(n);
    reporter?.report(block.id, {
      score: outcome === "success" ? s.points : 0,
      maxScore: s.points,
      passed: outcome === "success",
      attempts: n,
      response: choices,
      completed: true,
    });
  };

  const goTo = (target: string, choices: string[]) => {
    setPending(null);
    const next = c.scenes.find((x) => x.id === target);
    if (!next) return finish("end", choices);
    setSceneId(next.id);
    if (next.choices.length === 0) finish(next, choices);
  };

  const restart = () => {
    setSceneId(null);
    setPending(null);
    setPath([]);
    setEnded(null);
  };

  if (sceneId === null) {
    return (
      <div className="cr-scenario">
        <span className="cr-eyebrow">Cenário interativo</span>
        <h3 className="cr-h">{c.title}</h3>
        {c.intro && <p className="cr-scenario-intro">{c.intro}</p>}
        {attempts > 0 && <p className="cr-feedback-meta">Você já percorreu este cenário {attempts}×. Experimente outros caminhos.</p>}
        <div className="cr-quiz-actions">
          <button type="button" className="cr-btn" onClick={() => goTo(c.startSceneId, [])} disabled={!c.scenes.length}>Iniciar cenário →</button>
        </div>
      </div>
    );
  }

  const outcome = ended ? (ended === "end" ? "neutral" : ended.outcome) : null;

  return (
    <div className="cr-scenario" data-outcome={outcome ?? undefined}>
      <div className="cr-scene-card is-player" key={sceneId} aria-live="polite">
        {outcome && <span className={`cr-outcome-badge is-${outcome}`}>{OUTCOME[outcome].icon} {OUTCOME[outcome].label}</span>}
        {scene?.media && <MediaImage media={scene.media} alt="" mode="view" className="cr-scene-img" />}
        {scene && <h4 className="cr-h">{scene.title}</h4>}
        {scene && <RichText html={scene.html} editable={false} />}
        {!scene && <p>Fim do cenário.</p>}

        {pending ? (
          <div className="cr-feedback is-neutral" role="status">
            <p>{pending.feedback}</p>
            <div className="cr-quiz-actions">
              <button type="button" className="cr-btn" onClick={() => goTo(pending.target, path)}>Continuar →</button>
            </div>
          </div>
        ) : (
          scene && scene.choices.length > 0 && !ended && (
            <ul className="cr-scenario-choices">
              {scene.choices.map((ch) => (
                <li key={ch.id}>
                  <button type="button" className="cr-scenario-choice" onClick={() => {
                    const nextPath = [...path, ch.id];
                    setPath(nextPath);
                    if (s.showFeedback && ch.feedback.trim()) setPending({ feedback: ch.feedback, target: ch.target });
                    else goTo(ch.target, nextPath);
                  }}>
                    <span>{ch.text}</span><span aria-hidden>→</span>
                  </button>
                </li>
              ))}
            </ul>
          )
        )}
      </div>
      {ended && (
        <div className="cr-scenario-end">
          {path.length > 0 && (
            <details>
              <summary>Suas decisões ({path.length})</summary>
              <ol>
                {path.map((id) => {
                  const ch = c.scenes.flatMap((x) => x.choices).find((x) => x.id === id);
                  return <li key={id}>{ch?.text}</li>;
                })}
              </ol>
            </details>
          )}
          {s.allowRestart && <button type="button" className="cr-btn cr-btn--ghost" onClick={restart}>↺ Tentar outro caminho</button>}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------ Etapa com desbloqueio */
export function GateView({ block, mode, update }: BlockViewProps<GateContent, GateSettings>) {
  const c = block.content;
  const s = block.settings;
  const scope = useLessonScope();
  const reporter = useActivityReporter();

  if (mode === "edit") {
    return (
      <div className="cr-gate is-editing">
        <span className="cr-gate-line" />
        <div className="cr-gate-center">
          <span className="cr-gate-lock" aria-hidden>🔒</span>
          <span className="cr-btn"><EditableText value={c.label} editable placeholder="Continuar" onChange={(v) => update?.((d) => { d.content.label = v; }, `${block.id}:label`)} /></span>
          {s.requireActivities && (
            <EditableText as="p" className="cr-gate-msg" value={c.lockedMessage} editable placeholder="Mensagem enquanto bloqueado"
              onChange={(v) => update?.((d) => { d.content.lockedMessage = v; }, `${block.id}:msg`)} />
          )}
          <p className="cr-edit-hint">Para o aluno, o conteúdo abaixo fica oculto até {s.requireActivities ? "concluir as atividades acima e " : ""}clicar no botão.</p>
        </div>
        <span className="cr-gate-line" />
      </div>
    );
  }

  if (!scope || scope.isUnlocked(block.id)) {
    return <div className="cr-gate is-open" aria-hidden><span className="cr-gate-line" /></div>;
  }
  const pending = s.requireActivities ? scope.activitiesBefore(block.id).filter((id) => !reporter?.get(id)?.completed) : [];
  const locked = pending.length > 0;
  return (
    <div className="cr-gate">
      <span className="cr-gate-line" />
      <div className="cr-gate-center">
        <button type="button" className="cr-btn" disabled={locked} onClick={() => scope.unlock(block.id)}>
          {locked ? "🔒 " : ""}{c.label || "Continuar"} {!locked && "↓"}
        </button>
        {locked && <p className="cr-gate-msg">{c.lockedMessage} ({pending.length} pendente{pending.length > 1 ? "s" : ""})</p>}
      </div>
      <span className="cr-gate-line" />
    </div>
  );
}

/* --------------------------------------------- Feedback de desempenho */
function Ring({ pct }: { pct: number }) {
  const r = 42;
  const len = 2 * Math.PI * r;
  return (
    <svg className="cr-perf-ring" viewBox="0 0 100 100" aria-hidden>
      <circle cx="50" cy="50" r={r} className="cr-perf-track" />
      <circle cx="50" cy="50" r={r} className="cr-perf-value" strokeDasharray={len} strokeDashoffset={len * (1 - pct / 100)} />
      <text x="50" y="56" textAnchor="middle">{pct}%</text>
    </svg>
  );
}

export function PerformanceView({ block, mode, update }: BlockViewProps<PerformanceContent, PerformanceSettings>) {
  const c = block.content;
  const s = block.settings;
  const scope = useLessonScope();
  const reporter = useActivityReporter();

  if (mode === "edit") {
    const set = <K extends keyof PerformanceContent>(k: K) => (v: string) => update?.((d) => { d.content[k] = v; }, `${block.id}:${k}`);
    return (
      <div className="cr-perf is-editing">
        <EditableText as="h3" className="cr-h" value={c.title} editable placeholder="Título" onChange={set("title")} />
        <p className="cr-edit-hint">Calculado com as atividades {s.scope === "lesson" ? "desta aula" : "de todo o treinamento"}. Mensagens por faixa de aproveitamento:</p>
        <div className="cr-perf-messages">
          <div className="cr-feedback is-correct"><strong>≥ {s.highThreshold}%</strong><EditableText as="p" value={c.high} editable multiline onChange={set("high")} /></div>
          <div className="cr-feedback is-neutral"><strong>{s.lowThreshold}–{s.highThreshold - 1}%</strong><EditableText as="p" value={c.medium} editable multiline onChange={set("medium")} /></div>
          <div className="cr-feedback is-incorrect"><strong>&lt; {s.lowThreshold}%</strong><EditableText as="p" value={c.low} editable multiline onChange={set("low")} /></div>
        </div>
      </div>
    );
  }

  const ids = (s.scope === "lesson" ? scope?.lessonActivityIds : scope?.courseActivityIds) ?? [];
  const results = ids.map((id) => reporter?.get(id)).filter((r): r is NonNullable<typeof r> => !!r && r.attempts > 0);
  const graded = results.filter((r) => r.maxScore > 0);
  const score = graded.reduce((n, r) => n + r.score, 0);
  const max = graded.reduce((n, r) => n + r.maxScore, 0);
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const message = results.length === 0 ? c.empty : max === 0 ? c.high : pct >= s.highThreshold ? c.high : pct >= s.lowThreshold ? c.medium : c.low;
  const tone = results.length === 0 ? "" : max === 0 || pct >= s.highThreshold ? "is-high" : pct >= s.lowThreshold ? "is-medium" : "is-low";

  return (
    <div className={`cr-perf ${tone}`} aria-live="polite">
      <h3 className="cr-h">{c.title}</h3>
      <div className="cr-perf-body">
        <Ring pct={pct} />
        <div className="cr-perf-stats">
          <p className="cr-perf-message">{message}</p>
          <dl>
            <div><dt>Respondidas</dt><dd>{results.length} de {ids.length}</dd></div>
            {max > 0 && <div><dt>Pontos</dt><dd>{Math.round(score * 100) / 100} de {max}</dd></div>}
            <div><dt>Acertos</dt><dd>{results.filter((r) => r.passed).length}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  );
}
