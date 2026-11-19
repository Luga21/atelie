"use client";
/**
 * Registro do lado "editor" dos blocos: painel de propriedades, ícone e prévia.
 * Nada daqui é incluído no player exportado.
 */
import {
  AlignLeft, ArrowDownUp, CheckSquare, CircleDot, Columns3, GalleryHorizontal, GitBranch, Heading, Image as ImageIcon,
  Images, Layers, LayoutGrid, Link2, List, ListChecks, LockKeyhole, MapPin, Milestone, Minus, PanelsTopLeft, PanelTop,
  MessageSquareText, Quote, Table2, ToggleLeft, Trophy, Video, Volume2,
} from "lucide-react";
import type { ReactNode } from "react";
import type { BlockEditorKit } from "./editor-ui/types";
import {
  ColumnsInspector, DividerInspector, HeadingInspector, ImageInspector, ListInspector, QuoteInspector, TextImageInspector,
  TextInspector, VideoInspector,
} from "./library/content/inspectors";
import { AccordionInspector, FlashcardsInspector, ProcessInspector, TabsInspector } from "./library/interactive/inspectors";
import { ChoiceInspector } from "./library/activity/inspectors";
import { AudioInspector, GalleryInspector } from "./library/media/inspectors";
import { HotspotsInspector, RevealCardsInspector, TableInspector, TimelineInspector } from "./library/explore/inspectors";
import { MatchingInspector, OpenQuestionInspector, SortingInspector } from "./library/practice/inspectors";
import { GateInspector, PerformanceInspector, ScenarioInspector } from "./library/experience/inspectors";

/* ---------------------------------------------------- Prévias esquemáticas */
const C = { line: "#3a3e4b", soft: "#2a2d36", text: "#5d6272" };
const Frame = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 120 72" className="h-full w-full" aria-hidden>
    {children}
  </svg>
);
const Lines = ({ x = 14, y = 22, w = 92, n = 3, gap = 9 }: { x?: number; y?: number; w?: number; n?: number; gap?: number }) => (
  <>
    {Array.from({ length: n }, (_, i) => (
      <rect key={i} x={x} y={y + i * gap} width={i === n - 1 ? w * 0.6 : w} height="4" rx="2" fill={C.line} />
    ))}
  </>
);

const thumbs: Record<string, (t: string) => ReactNode> = {
  text: () => <Frame><Lines y={18} n={5} gap={8} /></Frame>,
  heading: (t) => <Frame><rect x="14" y="20" width="70" height="9" rx="3" fill={C.text} /><rect x="14" y="35" width="18" height="3" rx="1.5" fill={t} /><Lines y={46} n={1} w={80} /></Frame>,
  image: (t) => <Frame><rect x="18" y="10" width="84" height="52" rx="6" fill={C.soft} /><circle cx="40" cy="28" r="6" fill={t} opacity=".8" /><path d="M24 56 48 36l14 12 12-8 22 16Z" fill={C.line} /></Frame>,
  "text-image": (t) => <Frame><Lines x={12} y={20} w={46} n={4} gap={9} /><rect x="66" y="12" width="44" height="48" rx="5" fill={C.soft} /><circle cx="80" cy="28" r="5" fill={t} opacity=".8" /></Frame>,
  video: (t) => <Frame><rect x="14" y="10" width="92" height="52" rx="6" fill={C.soft} /><circle cx="60" cy="36" r="11" fill={t} /><path d="m56 30 10 6-10 6Z" fill="#fff" /></Frame>,
  list: (t) => <Frame>{[0, 1, 2].map((i) => <g key={i}><circle cx="20" cy={22 + i * 14} r="3.5" fill={t} /><rect x="30" y={20 + i * 14} width={i === 2 ? 50 : 72} height="4" rx="2" fill={C.line} /></g>)}</Frame>,
  quote: (t) => <Frame><rect x="16" y="14" width="3" height="44" rx="1.5" fill={t} /><Lines x={26} y={20} w={78} n={3} gap={10} /><rect x="26" y="52" width="30" height="4" rx="2" fill={C.text} /></Frame>,
  divider: (t) => <Frame><rect x="14" y="35" width="92" height="2" rx="1" fill={C.line} /><circle cx="60" cy="36" r="4" fill={t} /></Frame>,
  columns: (t) => <Frame>{[0, 1].map((i) => <g key={i}><rect x={12 + i * 50} y="12" width="46" height="48" rx="5" fill={C.soft} /><rect x={18 + i * 50} y="20" width="24" height="5" rx="2" fill={t} /><Lines x={18 + i * 50} y={32} w={34} n={3} gap={7} /></g>)}</Frame>,
  accordion: (t) => <Frame>{[0, 1, 2].map((i) => <g key={i}><rect x="14" y={10 + i * 18} width="92" height="14" rx="4" fill={i === 0 ? C.text : C.soft} /><path d={`m96 ${15 + i * 18} 3 3 3-3`} stroke={i === 0 ? t : C.line} strokeWidth="1.6" fill="none" /></g>)}</Frame>,
  tabs: (t) => <Frame><rect x="14" y="12" width="26" height="8" rx="3" fill={t} /><rect x="44" y="12" width="26" height="8" rx="3" fill={C.soft} /><rect x="74" y="12" width="26" height="8" rx="3" fill={C.soft} /><rect x="14" y="26" width="92" height="36" rx="5" fill={C.soft} /><Lines x={22} y={34} w={70} n={3} gap={8} /></Frame>,
  flashcards: (t) => <Frame><rect x="14" y="16" width="40" height="44" rx="6" fill={t} /><rect x="62" y="12" width="44" height="48" rx="6" fill={C.soft} transform="rotate(6 84 36)" /><rect x="22" y="34" width="24" height="4" rx="2" fill="#fff" opacity=".85" /></Frame>,
  process: (t) => <Frame>{[0, 1, 2, 3].map((i) => <circle key={i} cx={22 + i * 25} cy="18" r="5" fill={i < 2 ? t : C.line} />)}<rect x="22" y="17" width="75" height="2" fill={C.line} opacity=".6" /><rect x="14" y="30" width="92" height="32" rx="5" fill={C.soft} /><Lines x={22} y={38} w={64} n={2} /></Frame>,
  "multiple-choice": (t) => <Frame><rect x="14" y="10" width="70" height="6" rx="3" fill={C.text} />{[0, 1, 2].map((i) => <g key={i}><rect x="14" y={22 + i * 15} width="92" height="11" rx="4" fill={i === 1 ? "none" : C.soft} stroke={i === 1 ? t : "none"} /><circle cx="22" cy={27.5 + i * 15} r="3" fill={i === 1 ? t : C.line} /></g>)}</Frame>,
  "multiple-select": (t) => <Frame><rect x="14" y="10" width="70" height="6" rx="3" fill={C.text} />{[0, 1, 2].map((i) => <g key={i}><rect x="14" y={22 + i * 15} width="92" height="11" rx="4" fill={C.soft} /><rect x="19" y={24.5 + i * 15} width="6" height="6" rx="1.5" fill={i !== 1 ? t : C.line} /></g>)}</Frame>,
  gallery: (t) => <Frame>{[0, 1, 2].map((i) => <rect key={i} x={12 + i * 33} y="16" width="30" height="40" rx="4" fill={i === 1 ? t : C.soft} opacity={i === 1 ? 0.85 : 1} />)}</Frame>,
  audio: (t) => <Frame><rect x="14" y="22" width="92" height="28" rx="14" fill={C.soft} /><circle cx="28" cy="36" r="8" fill={t} /><path d="m25 32 7 4-7 4Z" fill="#fff" />{Array.from({ length: 14 }, (_, i) => <rect key={i} x={42 + i * 4.5} y={36 - ((i * 7) % 9) - 2} width="2.5" height={((i * 7) % 9) * 2 + 4} rx="1" fill={i < 6 ? t : C.line} />)}</Frame>,
  "reveal-cards": (t) => <Frame>{[0, 1, 2].map((i) => <g key={i}><rect x={12 + i * 33} y="12" width="30" height="30" rx="5" fill={i === 0 ? t : C.soft} /><text x={27 + i * 33} y="31" textAnchor="middle" fontSize="12" fill={i === 0 ? "#fff" : C.text}>+</text></g>)}<rect x="12" y="48" width="96" height="14" rx="4" fill={C.soft} /><Lines x={18} y={53} w={60} n={1} /></Frame>,
  hotspots: (t) => <Frame><rect x="12" y="10" width="96" height="52" rx="6" fill={C.soft} /><path d="M18 56 44 32l14 12 12-8 32 20Z" fill={C.line} /><circle cx="40" cy="24" r="6" fill={t} /><circle cx="80" cy="40" r="6" fill={t} /><circle cx="80" cy="40" r="10" fill="none" stroke={t} opacity=".5" /></Frame>,
  timeline: (t) => <Frame><rect x="24" y="10" width="2" height="52" fill={C.line} />{[0, 1, 2].map((i) => <g key={i}><circle cx="25" cy={16 + i * 20} r="4" fill={t} /><rect x="36" y={12 + i * 20} width="22" height="4" rx="2" fill={t} opacity=".7" /><rect x="36" y={19 + i * 20} width="64" height="4" rx="2" fill={C.line} /></g>)}</Frame>,
  table: (t) => <Frame><rect x="12" y="12" width="96" height="12" rx="3" fill={t} opacity=".85" />{[0, 1, 2].map((r) => <rect key={r} x="12" y={26 + r * 12} width="96" height="10" rx="2" fill={r % 2 ? C.soft : "none"} stroke={C.soft} />)}<rect x="44" y="12" width="1.5" height="60" fill={C.line} opacity=".6" /><rect x="76" y="12" width="1.5" height="60" fill={C.line} opacity=".6" /></Frame>,
  matching: (t) => <Frame>{[0, 1, 2].map((i) => <g key={i}><rect x="12" y={12 + i * 18} width="34" height="12" rx="3" fill={C.soft} /><rect x="74" y={12 + i * 18} width="34" height="12" rx="3" fill={C.soft} /></g>)}<path d="M46 18 74 54M46 36 74 18M46 54 74 36" stroke={t} strokeWidth="1.8" /></Frame>,
  sorting: (t) => <Frame>{[0, 1, 2, 3].map((i) => <g key={i}><rect x={i === 1 ? 20 : 14} y={10 + i * 14} width="92" height="11" rx="3" fill={i === 1 ? "none" : C.soft} stroke={i === 1 ? t : "none"} /><rect x={i === 1 ? 26 : 20} y={14 + i * 14} width="6" height="3" rx="1" fill={i === 1 ? t : C.line} /></g>)}</Frame>,
  "open-question": (t) => <Frame><rect x="14" y="10" width="70" height="6" rx="3" fill={C.text} /><rect x="14" y="24" width="92" height="38" rx="5" fill="none" stroke={C.line} /><rect x="20" y="31" width="40" height="3" rx="1.5" fill={C.line} /><rect x="20" y="31" width="1.5" height="9" fill={t} /></Frame>,
  scenario: (t) => <Frame><rect x="44" y="8" width="32" height="14" rx="4" fill={t} /><path d="M60 22v8M60 30 30 42M60 30l30 12" stroke={C.line} strokeWidth="1.6" fill="none" /><rect x="14" y="42" width="32" height="14" rx="4" fill={C.soft} /><rect x="74" y="42" width="32" height="14" rx="4" fill={C.soft} /><circle cx="30" cy="62" r="3" fill="#3dd68c" /><circle cx="90" cy="62" r="3" fill="#ff6369" /></Frame>,
  gate: (t) => <Frame><rect x="12" y="35" width="30" height="2" fill={C.line} /><rect x="78" y="35" width="30" height="2" fill={C.line} /><rect x="44" y="27" width="32" height="18" rx="9" fill={t} /><rect x="56" y="52" width="8" height="8" rx="1.5" fill={C.line} /><path d="M57.5 52v-3a2.5 2.5 0 0 1 5 0v3" stroke={C.line} fill="none" /></Frame>,
  performance: (t) => <Frame><circle cx="36" cy="36" r="20" fill="none" stroke={C.soft} strokeWidth="7" /><circle cx="36" cy="36" r="20" fill="none" stroke={t} strokeWidth="7" strokeDasharray="126" strokeDashoffset="38" transform="rotate(-90 36 36)" /><rect x="66" y="24" width="40" height="5" rx="2.5" fill={C.text} /><Lines x={66} y={36} w={40} n={2} gap={8} /></Frame>,
  "true-false": (t) => <Frame><rect x="14" y="12" width="92" height="6" rx="3" fill={C.text} /><rect x="14" y="30" width="44" height="26" rx="5" fill="none" stroke={t} strokeWidth="1.5" /><rect x="62" y="30" width="44" height="26" rx="5" fill={C.soft} /><path d="m29 43 4 4 8-8" stroke={t} strokeWidth="2" fill="none" /><path d="m80 39 8 8m0-8-8 8" stroke={C.line} strokeWidth="2" /></Frame>,
};

function kit(type: string, icon: ReactNode, tint: string, Inspector?: BlockEditorKit["Inspector"]): [string, BlockEditorKit] {
  const draw = thumbs[type];
  const Thumb = () => <>{draw ? draw(tint) : null}</>;
  Thumb.displayName = `Thumb(${type})`;
  return [type, { icon, tint, Inspector, Thumb }];
}

const TINT = { content: "#5b8cff", media: "#2fbf9b", interactive: "#f5a524", activity: "#f0577a", layout: "#a07cff", experience: "#22c3e6" };

export const BLOCK_EDITOR_KITS: Record<string, BlockEditorKit> = Object.fromEntries([
  kit("heading", <Heading />, TINT.content, HeadingInspector),
  kit("text", <AlignLeft />, TINT.content, TextInspector),
  kit("list", <List />, TINT.content, ListInspector),
  kit("quote", <Quote />, TINT.content, QuoteInspector),
  kit("image", <ImageIcon />, TINT.media, ImageInspector),
  kit("text-image", <PanelsTopLeft />, TINT.media, TextImageInspector),
  kit("video", <Video />, TINT.media, VideoInspector),
  kit("divider", <Minus />, TINT.content, DividerInspector),
  kit("columns", <Columns3 />, TINT.layout, ColumnsInspector),
  kit("accordion", <PanelTop />, TINT.interactive, AccordionInspector),
  kit("tabs", <GalleryHorizontal />, TINT.interactive, TabsInspector),
  kit("flashcards", <Layers />, TINT.interactive, FlashcardsInspector),
  kit("process", <ListChecks />, TINT.interactive, ProcessInspector),
  kit("multiple-choice", <CircleDot />, TINT.activity, ChoiceInspector),
  kit("multiple-select", <CheckSquare />, TINT.activity, ChoiceInspector),
  kit("true-false", <ToggleLeft />, TINT.activity, ChoiceInspector),
  kit("gallery", <Images />, TINT.media, GalleryInspector),
  kit("audio", <Volume2 />, TINT.media, AudioInspector),
  kit("reveal-cards", <LayoutGrid />, TINT.interactive, RevealCardsInspector),
  kit("hotspots", <MapPin />, TINT.interactive, HotspotsInspector),
  kit("timeline", <Milestone />, TINT.interactive, TimelineInspector),
  kit("table", <Table2 />, TINT.layout, TableInspector),
  kit("matching", <Link2 />, TINT.activity, MatchingInspector),
  kit("sorting", <ArrowDownUp />, TINT.activity, SortingInspector),
  kit("open-question", <MessageSquareText />, TINT.activity, OpenQuestionInspector),
  kit("scenario", <GitBranch />, TINT.experience, ScenarioInspector),
  kit("gate", <LockKeyhole />, TINT.experience, GateInspector),
  kit("performance", <Trophy />, TINT.experience, PerformanceInspector),
]);
