"use client";
import { Palette } from "lucide-react";
import { Field, Section, Segmented, Select } from "@/blocks/editor-ui/fields";
import { FONT_OPTIONS } from "@/core/theme/fonts";
import { THEME_PRESETS } from "@/core/theme/presets";
import type { Theme, ThemeColors } from "@/core/theme/types";
import { cn } from "@/ui/cn";
import { useEditor } from "../state/editorStore";
import { PanelHeader } from "./RightPanel";

const COLOR_FIELDS: { key: keyof ThemeColors; label: string; hint?: string }[] = [
  { key: "primary", label: "Primária", hint: "Botões, links, destaques" },
  { key: "secondary", label: "Secundária", hint: "Fundos escuros e contrastes" },
  { key: "accent", label: "Destaque", hint: "Detalhes e realces" },
  { key: "background", label: "Fundo" },
  { key: "surface", label: "Superfície", hint: "Cards e áreas de apoio" },
  { key: "text", label: "Texto" },
  { key: "textMuted", label: "Texto secundário" },
  { key: "border", label: "Bordas" },
  { key: "success", label: "Acerto" },
  { key: "danger", label: "Erro" },
];

function ColorRow({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2.5">
      <label className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-ink-600" style={{ background: value }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} aria-label={label} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      </label>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-medium text-ink-200">{label}</div>
        {hint && <div className="truncate text-[10.5px] text-ink-500">{hint}</div>}
      </div>
      <input
        defaultValue={value}
        onChange={(e) => /^#[0-9a-f]{6}$/i.test(e.target.value) && onChange(e.target.value.toUpperCase())}
        onBlur={(e) => (e.target.value = value)}
        aria-label={`${label} (hexadecimal)`}
        className="h-7 w-[84px] rounded-md border border-ink-700 bg-ink-950 px-2 font-mono text-[11.5px] uppercase text-ink-200 outline-none focus:border-brand-500"
        key={value}
      />
    </div>
  );
}

export function ThemePanel() {
  const theme = useEditor((s) => s.course!.theme);
  const st = useEditor.getState();

  const setTheme = <G extends keyof Theme>(group: G, patch: Partial<Theme[G]>, key?: string) =>
    st.apply((d) => {
      Object.assign(d.theme[group] as object, patch);
      d.theme.presetId = null;
    }, key);

  return (
    <>
      <PanelHeader icon={<Palette className="text-brand-300" />} title="Identidade visual" subtitle="Alterações aplicadas a todo o treinamento, em tempo real." onClose={() => st.setPanel(null)} />
      <div className="flex-1 overflow-y-auto scroll-thin">
        <Section title="Temas prontos">
          <div className="grid grid-cols-2 gap-2">
            {THEME_PRESETS.map((p) => {
              const c = p.theme.colors;
              const active = theme.presetId === p.id;
              return (
                <button key={p.id} type="button" onClick={() => st.apply((d) => { d.theme = structuredClone(p.theme); })}
                  className={cn("overflow-hidden rounded-xl border text-left transition-all hover:-translate-y-0.5", active ? "border-brand-400 ring-2 ring-brand-500/40" : "border-ink-700 hover:border-ink-500")}>
                  <div className="flex h-12 items-end gap-1 p-2" style={{ background: c.background }}>
                    <span className="h-5 w-5 rounded-full" style={{ background: c.primary }} />
                    <span className="h-5 w-5 rounded-full" style={{ background: c.accent }} />
                    <span className="h-5 w-5 rounded-full border border-black/10" style={{ background: c.surface }} />
                    <span className="ml-auto text-[15px] font-bold" style={{ color: c.text }}>Aa</span>
                  </div>
                  <div className="bg-ink-850 px-2.5 py-1.5 text-[12px] font-medium text-ink-100">{p.name}</div>
                </button>
              );
            })}
          </div>
          {!theme.presetId && <p className="text-[11px] text-ink-500">Tema personalizado.</p>}
        </Section>

        <Section title="Cores">
          {COLOR_FIELDS.map((f) => (
            <ColorRow key={f.key} label={f.label} hint={f.hint} value={theme.colors[f.key]} onChange={(v) => setTheme("colors", { [f.key]: v }, `theme:color:${f.key}`)} />
          ))}
        </Section>

        <Section title="Tipografia">
          <Field label="Fonte dos títulos">
            <Select value={theme.typography.headingFont} onChange={(v) => setTheme("typography", { headingFont: v })} options={FONT_OPTIONS} />
          </Field>
          <Field label="Fonte dos textos">
            <Select value={theme.typography.bodyFont} onChange={(v) => setTheme("typography", { bodyFont: v })} options={FONT_OPTIONS} />
          </Field>
          <Field label="Escala dos títulos">
            <Segmented value={theme.typography.headingScale} onChange={(v) => setTheme("typography", { headingScale: v })}
              options={[{ value: "sm", label: "P" }, { value: "md", label: "M" }, { value: "lg", label: "G" }, { value: "xl", label: "GG" }]} />
          </Field>
          <Field label={`Tamanho do texto · ${theme.typography.bodySize}px`}>
            <input type="range" min={14} max={21} step={1} value={theme.typography.bodySize} aria-label="Tamanho do texto"
              onChange={(e) => setTheme("typography", { bodySize: Number(e.target.value) }, "theme:bodySize")} className="w-full accent-[var(--color-brand-500)]" />
          </Field>
          <Field label="Peso dos títulos">
            <Segmented value={theme.typography.headingWeight} onChange={(v) => setTheme("typography", { headingWeight: v })}
              options={[500, 600, 700, 800].map((w) => ({ value: w as 500, label: String(w) }))} />
          </Field>
          <Field label="Peso dos textos">
            <Segmented value={theme.typography.bodyWeight} onChange={(v) => setTheme("typography", { bodyWeight: v })}
              options={[300, 400, 500].map((w) => ({ value: w as 400, label: String(w) }))} />
          </Field>
        </Section>

        <Section title="Componentes">
          <Field label="Arredondamento">
            <Segmented value={theme.components.radius} onChange={(v) => setTheme("components", { radius: v })}
              options={[{ value: "none", label: "0" }, { value: "sm", label: "P" }, { value: "md", label: "M" }, { value: "lg", label: "G" }, { value: "xl", label: "GG" }]} />
          </Field>
          <Field label="Botões">
            <Segmented value={theme.components.buttonStyle} onChange={(v) => setTheme("components", { buttonStyle: v })}
              options={[{ value: "solid", label: "Sólido" }, { value: "soft", label: "Suave" }, { value: "outline", label: "Contorno" }, { value: "pill", label: "Pílula" }]} />
          </Field>
          <Field label="Cards">
            <Segmented value={theme.components.cardStyle} onChange={(v) => setTheme("components", { cardStyle: v })}
              options={[{ value: "flat", label: "Plano" }, { value: "outlined", label: "Borda" }, { value: "elevated", label: "Elevado" }]} />
          </Field>
          <Field label="Sombras">
            <Segmented value={theme.components.shadow} onChange={(v) => setTheme("components", { shadow: v })}
              options={[{ value: "none", label: "Sem" }, { value: "sm", label: "P" }, { value: "md", label: "M" }, { value: "lg", label: "G" }]} />
          </Field>
          <Field label="Elementos interativos">
            <Segmented value={theme.components.interactiveStyle} onChange={(v) => setTheme("components", { interactiveStyle: v })}
              options={[{ value: "subtle", label: "Sutil" }, { value: "bold", label: "Marcante" }]} />
          </Field>
        </Section>

        <Section title="Layout">
          <Field label="Largura do conteúdo">
            <Segmented value={theme.layout.contentWidth} onChange={(v) => setTheme("layout", { contentWidth: v })}
              options={[{ value: "narrow", label: "Estreita" }, { value: "medium", label: "Média" }, { value: "wide", label: "Larga" }]} />
          </Field>
          <Field label="Espaço entre blocos">
            <Segmented value={theme.layout.blockSpacing} onChange={(v) => setTheme("layout", { blockSpacing: v })}
              options={[{ value: "compact", label: "Compacto" }, { value: "normal", label: "Normal" }, { value: "relaxed", label: "Amplo" }]} />
          </Field>
          <Field label="Navegação do aluno">
            <Segmented value={theme.layout.navigation} onChange={(v) => setTheme("layout", { navigation: v })}
              options={[{ value: "sidebar", label: "Barra lateral" }, { value: "top", label: "Menu superior" }]} />
          </Field>
          <Field label="Cabeçalho das aulas">
            <Segmented value={theme.layout.header} onChange={(v) => setTheme("layout", { header: v })}
              options={[{ value: "minimal", label: "Mínimo" }, { value: "banner", label: "Faixa" }, { value: "hero", label: "Destaque" }]} />
          </Field>
          <Field label="Estilo da capa">
            <Segmented value={theme.layout.coverStyle} onChange={(v) => setTheme("layout", { coverStyle: v })}
              options={[{ value: "full", label: "Tela cheia" }, { value: "split", label: "Dividida" }, { value: "minimal", label: "Mínima" }]} />
          </Field>
        </Section>
      </div>
    </>
  );
}
