"use client";
import { Field, ItemsField, MediaField, moveItem, Section, Segmented, Select, TextField, ToggleField } from "../../editor-ui/fields";
import type { BlockInspectorProps } from "../../editor-ui/types";
import {
  createScene, END, type GateContent, type GateSettings, type PerformanceContent, type PerformanceSettings,
  type ScenarioContent, type ScenarioSettings,
} from "./definitions";

/** Verificações estruturais do cenário, exibidas como avisos ao autor. */
export function scenarioIssues(c: ScenarioContent): string[] {
  const issues: string[] = [];
  const ids = new Set(c.scenes.map((s) => s.id));
  if (!ids.has(c.startSceneId)) issues.push("Defina a cena inicial.");
  const reachable = new Set<string>();
  const walk = (id: string) => {
    if (reachable.has(id) || !ids.has(id)) return;
    reachable.add(id);
    c.scenes.find((s) => s.id === id)?.choices.forEach((ch) => walk(ch.target));
  };
  walk(c.startSceneId);
  const orphan = c.scenes.filter((s) => !reachable.has(s.id));
  if (orphan.length) issues.push(`Cenas sem caminho a partir do início: ${orphan.map((s) => s.title).join(", ")}.`);
  if (!c.scenes.some((s) => s.choices.length === 0 && reachable.has(s.id))) {
    const endsByChoice = c.scenes.some((s) => s.choices.some((ch) => ch.target === END || !ids.has(ch.target)));
    if (!endsByChoice) issues.push("Nenhum caminho leva a um final.");
  }
  if (!c.scenes.some((s) => s.choices.length === 0 && s.outcome === "success")) issues.push("Não há desfecho positivo: o aluno nunca pontuará.");
  return issues;
}

export function ScenarioInspector({ block, update }: BlockInspectorProps<ScenarioContent, ScenarioSettings>) {
  const c = block.content;
  const s = block.settings;
  const issues = scenarioIssues(c);
  return (
    <>
      {issues.length > 0 && (
        <div className="mx-4 mt-3 space-y-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200">
          {issues.map((i) => <p key={i}>{i}</p>)}
        </div>
      )}
      <Section title="Estrutura">
        <Field label="Cena inicial">
          <Select value={c.startSceneId} onChange={(v) => update((d) => { d.content.startSceneId = v; })}
            options={c.scenes.map((sc, i) => ({ value: sc.id, label: `${i + 1}. ${sc.title}` }))} />
        </Field>
        <ItemsField label="Cenas" items={c.scenes} min={1} addLabel="Adicionar cena"
          getTitle={(sc) => `${sc.title}${sc.choices.length ? ` · ${sc.choices.length} escolhas` : " · final"}`}
          onAdd={() => update((d) => { d.content.scenes.push(createScene(`Cena ${d.content.scenes.length + 1}`)); })}
          onRemove={(i) => update((d) => {
            const [removed] = d.content.scenes.splice(i, 1);
            d.content.scenes.forEach((sc) => sc.choices.forEach((ch) => { if (ch.target === removed.id) ch.target = END; }));
            if (d.content.startSceneId === removed.id) d.content.startSceneId = d.content.scenes[0]?.id ?? "";
          })}
          onMove={(a, b) => update((d) => moveItem(d.content.scenes, a, b))}
          renderItem={(sc, i) => (
            <>
              <TextField label="Título" value={sc.title} onChange={(v) => update((d) => { d.content.scenes[i].title = v; }, `${block.id}:st:${sc.id}`)} />
              <MediaField label="Imagem (opcional)" value={sc.media} onChange={(m) => update((d) => { d.content.scenes[i].media = m; })} />
              {sc.choices.length === 0 && (
                <Field label="Desfecho">
                  <Segmented value={sc.outcome} onChange={(v) => update((d) => { d.content.scenes[i].outcome = v; })}
                    options={[{ value: "success", label: "Positivo" }, { value: "neutral", label: "Neutro" }, { value: "failure", label: "Negativo" }]} />
                </Field>
              )}
            </>
          )} />
        <p className="text-[11px] leading-relaxed text-ink-500">Textos, escolhas e destinos são editados no canvas, cena a cena.</p>
      </Section>
      <Section title="Comportamento">
        <ToggleField label="Mostrar consequência de cada escolha" checked={s.showFeedback} onChange={(v) => update((d) => { d.settings.showFeedback = v; })} />
        <ToggleField label="Permitir recomeçar" checked={s.allowRestart} onChange={(v) => update((d) => { d.settings.allowRestart = v; })} />
        <Field label="Pontos (desfecho positivo)">
          <Segmented value={s.points} onChange={(v) => update((d) => { d.settings.points = v; })} options={[1, 2, 3, 5, 10].map((n) => ({ value: n, label: String(n) }))} />
        </Field>
      </Section>
    </>
  );
}

export function GateInspector({ block, update }: BlockInspectorProps<GateContent, GateSettings>) {
  return (
    <Section title="Desbloqueio">
      <ToggleField label="Exigir atividades concluídas" hint="Todas as atividades acima, nesta aula" checked={block.settings.requireActivities}
        onChange={(v) => update((d) => { d.settings.requireActivities = v; })} />
      <TextField label="Texto do botão" value={block.content.label} onChange={(v) => update((d) => { d.content.label = v; }, `${block.id}:label`)} />
      {block.settings.requireActivities && (
        <TextField label="Mensagem enquanto bloqueado" multiline value={block.content.lockedMessage}
          onChange={(v) => update((d) => { d.content.lockedMessage = v; }, `${block.id}:msg`)} />
      )}
    </Section>
  );
}

export function PerformanceInspector({ block, update }: BlockInspectorProps<PerformanceContent, PerformanceSettings>) {
  const s = block.settings;
  return (
    <Section title="Cálculo">
      <Field label="Considerar atividades">
        <Segmented value={s.scope} onChange={(v) => update((d) => { d.settings.scope = v; })}
          options={[{ value: "lesson", label: "Desta aula" }, { value: "course", label: "Do treinamento" }]} />
      </Field>
      <Field label={`Faixa alta a partir de ${s.highThreshold}%`}>
        <input type="range" min={50} max={100} step={5} value={s.highThreshold} className="w-full accent-[var(--color-brand-500)]"
          onChange={(e) => update((d) => { d.settings.highThreshold = Math.max(Number(e.target.value), d.settings.lowThreshold + 5); }, `${block.id}:hi`)} />
      </Field>
      <Field label={`Faixa baixa abaixo de ${s.lowThreshold}%`}>
        <input type="range" min={0} max={95} step={5} value={s.lowThreshold} className="w-full accent-[var(--color-brand-500)]"
          onChange={(e) => update((d) => { d.settings.lowThreshold = Math.min(Number(e.target.value), d.settings.highThreshold - 5); }, `${block.id}:lo`)} />
      </Field>
      <TextField label="Mensagem sem respostas" value={block.content.empty} onChange={(v) => update((d) => { d.content.empty = v; }, `${block.id}:empty`)} />
      <p className="text-[11px] leading-relaxed text-ink-500">Coloque este bloco depois das atividades. Ele atualiza em tempo real conforme o aluno responde.</p>
    </Section>
  );
}
