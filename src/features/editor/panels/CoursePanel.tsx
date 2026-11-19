"use client";
import { useMemo } from "react";
import { Settings2 } from "lucide-react";
import { hasGradedActivities } from "@/export/scorm";
import { Field, MediaField, Section, Select, TextField, ToggleField } from "@/blocks/editor-ui/fields";
import { STATUS_LABEL, type CourseStatus } from "@/core/model/types";
import { formatDate } from "@/ui/format";
import { useEditor } from "../state/editorStore";
import { PanelHeader } from "./RightPanel";

export function CoursePanel() {
  const course = useEditor((s) => s.course)!;
  const st = useEditor.getState();
  const blocks = course.modules.reduce((n, m) => n + m.lessons.reduce((k, l) => k + l.blocks.length, 0), 0);
  const graded = useMemo(() => hasGradedActivities(course), [course]);

  return (
    <>
      <PanelHeader icon={<Settings2 className="text-brand-300" />} title="Treinamento" subtitle="Informações gerais, capa e status." onClose={() => st.setPanel(null)} />
      <div className="flex-1 overflow-y-auto scroll-thin">
        <Section title="Informações">
          <TextField label="Título" value={course.title} onChange={(v) => st.apply((d) => { d.title = v; }, "course:title")} />
          <TextField label="Descrição" multiline value={course.description} onChange={(v) => st.apply((d) => { d.description = v; }, "course:description")} />
          <Field label="Status">
            <Select<CourseStatus> value={course.status} onChange={(v) => st.apply((d) => { d.status = v; })}
              options={(Object.keys(STATUS_LABEL) as CourseStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] }))} />
          </Field>
        </Section>
        <Section title="Capa">
          <MediaField label="Imagem de capa" value={course.cover.image} onChange={(m) => st.apply((d) => { d.cover.image = m; })} />
          <TextField label="Rótulo acima do título" value={course.cover.eyebrow} placeholder="Ex.: Trilha de Onboarding"
            onChange={(v) => st.apply((d) => { d.cover.eyebrow = v; }, "cover:eyebrow")} />
          <TextField label="Texto do botão" value={course.cover.buttonLabel} onChange={(v) => st.apply((d) => { d.cover.buttonLabel = v; }, "cover:button")} />
          <ToggleField label="Exibir sumário na capa" checked={course.cover.showOutline} onChange={(v) => st.apply((d) => { d.cover.showOutline = v; })} />
          <p className="text-[11px] text-ink-500">O estilo visual da capa é definido em Tema → Layout.</p>
        </Section>
        <Section title="LMS (SCORM)">
          <Field label={`Nota mínima para aprovação · ${course.lms.passingScore}%`}
            hint={graded ? "Aplicada às atividades com nota do treinamento inteiro" : "Sem atividades com nota: o LMS registrará apenas a conclusão"}>
            <input type="range" min={0} max={100} step={5} value={course.lms.passingScore} aria-label="Nota mínima para aprovação"
              className="w-full accent-[var(--color-brand-500)]" disabled={!graded}
              onChange={(e) => st.apply((d) => { d.lms.passingScore = Number(e.target.value); }, "lms:passing")} />
          </Field>
          <p className="text-[11px] leading-relaxed text-ink-500">
            Concluído = todas as aulas vistas. Aprovado = concluído com nota ≥ mínima. O progresso é retomado de onde o aluno parou.
          </p>
          <p className="truncate text-[11px] text-ink-500" title={course.lms.identifier}>Identificador do pacote: <span className="font-mono text-ink-400">{course.lms.identifier}</span></p>
        </Section>
        <Section title="Resumo">
          <dl className="grid grid-cols-2 gap-2 text-[12px]">
            {[
              ["Módulos", course.modules.length],
              ["Aulas", course.modules.reduce((n, m) => n + m.lessons.length, 0)],
              ["Blocos", blocks],
              ["Criado em", formatDate(course.createdAt)],
            ].map(([k, v]) => (
              <div key={String(k)} className="rounded-lg bg-ink-850 px-3 py-2">
                <dt className="text-ink-500">{k}</dt>
                <dd className="font-semibold text-ink-100">{v}</dd>
              </div>
            ))}
          </dl>
        </Section>
      </div>
    </>
  );
}
