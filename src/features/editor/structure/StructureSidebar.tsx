"use client";
import { useState } from "react";
import {
  closestCenter, DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, Copy, FileText, GripVertical, MoreHorizontal, Pencil, Plus, Presentation, Trash2 } from "lucide-react";
import * as ops from "@/core/model/operations";
import type { Course, Lesson, Module } from "@/core/model/types";
import { cn } from "@/ui/cn";
import { Button, Dialog, IconButton, Menu } from "@/ui/primitives";
import { useEditor } from "../state/editorStore";

type Confirm = { kind: "module"; module: Module } | { kind: "lesson"; lesson: Lesson } | null;

function InlineRename({ value, onSubmit, onCancel, className }: { value: string; onSubmit: (v: string) => void; onCancel: () => void; className?: string }) {
  const [v, setV] = useState(value);
  return (
    <input
      autoFocus
      value={v}
      onChange={(e) => setV(e.target.value)}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={() => (v.trim() ? onSubmit(v.trim()) : onCancel())}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") onCancel();
        e.stopPropagation();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn("h-7 w-full min-w-0 rounded-md border border-brand-500 bg-ink-950 px-2 text-[13px] text-white outline-none", className)}
    />
  );
}

export function StructureSidebar() {
  const course = useEditor((s) => s.course)!;
  const selection = useEditor((s) => s.selection);
  const { apply, selectLesson, selectCover } = useEditor.getState();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [renaming, setRenaming] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [dragging, setDragging] = useState<{ type: "module" | "lesson"; title: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Importante: capturar apenas ids dentro da receita — o rascunho do Immer é revogado depois.
  const addModule = () => {
    let ids: { moduleId: string; lessonId?: string } | null = null;
    apply((d) => {
      const m = ops.addModule(d as Course);
      ids = { moduleId: m.id, lessonId: m.lessons[0]?.id };
    });
    const created = ids as { moduleId: string; lessonId?: string } | null;
    if (!created) return;
    if (created.lessonId) selectLesson(created.lessonId);
    setRenaming(created.moduleId);
  };

  const addLesson = (moduleId: string) => {
    let lessonId: string | null = null;
    apply((d) => { lessonId = ops.addLesson(d as Course, moduleId)?.id ?? null; });
    if (lessonId) {
      setCollapsed((c) => ({ ...c, [moduleId]: false }));
      selectLesson(lessonId);
      setRenaming(lessonId);
    }
  };

  const onDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current as { type: "module" | "lesson"; title: string };
    setDragging(data);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(null);
    if (!over || active.id === over.id) return;
    const a = active.data.current as { type: string; id: string };
    const o = over.data.current as { type: string; id: string; moduleId?: string };
    if (!a || !o) return;
    apply((d) => {
      const c = d as Course;
      if (a.type === "module") {
        const targetModuleId = o.type === "module" ? o.id : o.moduleId;
        const from = c.modules.findIndex((m) => m.id === a.id);
        const to = c.modules.findIndex((m) => m.id === targetModuleId);
        if (from >= 0 && to >= 0) ops.moveModule(c, from, to);
      } else if (a.type === "lesson") {
        if (o.type === "lesson") {
          const target = ops.findLesson(c, o.id);
          const src = ops.findLesson(c, a.id);
          if (!target || !src) return;
          let index = target.lessonIndex;
          if (src.module.id === target.module.id && src.lessonIndex < target.lessonIndex) index = target.lessonIndex;
          ops.moveLesson(c, a.id, target.module.id, index);
        } else if (o.type === "module") {
          const m = c.modules.find((x) => x.id === o.id);
          if (m) ops.moveLesson(c, a.id, m.id, m.lessons.length);
        }
      }
    });
  };

  const lessonCount = course.modules.reduce((n, m) => n + m.lessons.length, 0);

  return (
    <aside className="flex w-[264px] shrink-0 flex-col border-r border-ink-800 bg-ink-900" aria-label="Estrutura do treinamento">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <div>
          <h2 className="text-[13px] font-semibold text-white">Estrutura</h2>
          <p className="text-[11px] text-ink-500">{course.modules.length} módulos · {lessonCount} aulas</p>
        </div>
        <IconButton label="Adicionar módulo" size="sm" onClick={addModule}><Plus size={16} /></IconButton>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin px-2 pb-6">
        <button type="button" onClick={selectCover}
          className={cn("mb-2 flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors",
            selection.kind === "cover" ? "bg-brand-500/15 text-brand-200" : "text-ink-200 hover:bg-ink-800")}>
          <Presentation size={15} className={selection.kind === "cover" ? "text-brand-300" : "text-ink-500"} />
          Capa e apresentação
        </button>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
          <SortableContext items={course.modules.map((m) => `m:${m.id}`)} strategy={verticalListSortingStrategy}>
            {course.modules.map((m, mi) => (
              <ModuleItem
                key={m.id}
                module={m}
                index={mi}
                collapsed={!!collapsed[m.id]}
                onToggle={() => setCollapsed((c) => ({ ...c, [m.id]: !c[m.id] }))}
                renaming={renaming}
                setRenaming={setRenaming}
                onAddLesson={() => addLesson(m.id)}
                onDelete={() => (m.lessons.some((l) => l.blocks.length) ? setConfirm({ kind: "module", module: m }) : apply((d) => ops.removeModule(d as Course, m.id)))}
                onDeleteLesson={(l) => (l.blocks.length ? setConfirm({ kind: "lesson", lesson: l }) : apply((d) => ops.removeLesson(d as Course, l.id)))}
                selectedLessonId={selection.kind === "lesson" ? selection.lessonId : null}
              />
            ))}
          </SortableContext>
          <DragOverlay dropAnimation={null}>
            {dragging && (
              <div className="flex h-9 items-center gap-2 rounded-lg border border-brand-500/60 bg-ink-800 px-3 text-[13px] text-white shadow-2xl shadow-black/60">
                {dragging.type === "module" ? <ChevronRight size={14} /> : <FileText size={14} />}
                <span className="truncate">{dragging.title}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>

        <button type="button" onClick={addModule}
          className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink-700 text-[12px] font-medium text-ink-400 hover:border-brand-500/60 hover:text-brand-300">
          <Plus size={14} /> Novo módulo
        </button>
      </div>

      <Dialog open={!!confirm} onClose={() => setConfirm(null)}
        title={confirm?.kind === "module" ? "Excluir módulo?" : "Excluir aula?"}
        description={confirm?.kind === "module"
          ? `“${confirm.module.title}” e suas ${confirm.module.lessons.length} aulas serão removidos. Você pode desfazer com Ctrl+Z.`
          : `“${confirm?.lesson.title}” e seus ${confirm?.lesson.blocks.length} blocos serão removidos. Você pode desfazer com Ctrl+Z.`}>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirm(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => {
            if (confirm?.kind === "module") apply((d) => ops.removeModule(d as Course, confirm.module.id));
            if (confirm?.kind === "lesson") apply((d) => ops.removeLesson(d as Course, confirm.lesson.id));
            setConfirm(null);
          }}>Excluir</Button>
        </div>
      </Dialog>
    </aside>
  );
}

function ModuleItem({ module: m, index, collapsed, onToggle, renaming, setRenaming, onAddLesson, onDelete, onDeleteLesson, selectedLessonId }: {
  module: Module;
  index: number;
  collapsed: boolean;
  onToggle: () => void;
  renaming: string | null;
  setRenaming: (id: string | null) => void;
  onAddLesson: () => void;
  onDelete: () => void;
  onDeleteLesson: (l: Lesson) => void;
  selectedLessonId: string | null;
}) {
  const { apply } = useEditor.getState();
  const sortable = useSortable({ id: `m:${m.id}`, data: { type: "module", id: m.id, title: m.title } });
  const style = { transform: CSS.Translate.toString(sortable.transform), transition: sortable.transition };

  return (
    <div ref={sortable.setNodeRef} style={style} className={cn("mb-1", sortable.isDragging && "opacity-40")}>
      <div className="group flex h-9 items-center gap-0.5 rounded-lg pr-1 hover:bg-ink-800/70">
        <button type="button" {...sortable.attributes} {...sortable.listeners} aria-label={`Reordenar módulo ${m.title}`}
          className="grid h-7 w-5 cursor-grab place-items-center text-ink-600 opacity-0 group-hover:opacity-100 focus:opacity-100 active:cursor-grabbing">
          <GripVertical size={13} />
        </button>
        <button type="button" onClick={onToggle} aria-label={collapsed ? "Expandir módulo" : "Recolher módulo"} aria-expanded={!collapsed}
          className="grid h-6 w-5 place-items-center text-ink-500 hover:text-white">
          <ChevronRight size={14} className={cn("transition-transform", !collapsed && "rotate-90")} />
        </button>
        {renaming === m.id ? (
          <InlineRename value={m.title} onCancel={() => setRenaming(null)} onSubmit={(v) => { apply((d) => ops.renameModule(d as Course, m.id, v)); setRenaming(null); }} />
        ) : (
          <span className="flex min-w-0 flex-1 items-baseline gap-1.5 text-[12.5px] font-semibold text-ink-100" onDoubleClick={() => setRenaming(m.id)}>
            <span className="text-[10px] font-bold text-ink-500">{String(index + 1).padStart(2, "0")}</span>
            <span className="truncate">{m.title}</span>
          </span>
        )}
        <div className="flex opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <IconButton label="Adicionar aula" size="sm" onClick={onAddLesson}><Plus size={14} /></IconButton>
          <Menu width={190}
            trigger={(p) => <IconButton label="Opções do módulo" size="sm" {...p}><MoreHorizontal size={14} /></IconButton>}
            items={[
              { label: "Adicionar aula", icon: <Plus />, onSelect: onAddLesson },
              { label: "Renomear", icon: <Pencil />, onSelect: () => setRenaming(m.id) },
              { label: "Duplicar módulo", icon: <Copy />, onSelect: () => apply((d) => { ops.duplicateModule(d as Course, m.id); }) },
              { label: "", separator: true },
              { label: "Excluir módulo", icon: <Trash2 />, danger: true, onSelect: onDelete },
            ]} />
        </div>
      </div>

      {!collapsed && (
        <div className="ml-[22px] border-l border-ink-800 pl-1.5">
          <SortableContext items={m.lessons.map((l) => `l:${l.id}`)} strategy={verticalListSortingStrategy}>
            {m.lessons.map((l) => (
              <LessonItem key={l.id} lesson={l} moduleId={m.id} selected={selectedLessonId === l.id} renaming={renaming === l.id}
                setRenaming={setRenaming} onDelete={() => onDeleteLesson(l)} />
            ))}
          </SortableContext>
          {m.lessons.length === 0 && <EmptyModuleDrop moduleId={m.id} onAdd={onAddLesson} />}
        </div>
      )}
    </div>
  );
}

function EmptyModuleDrop({ moduleId, onAdd }: { moduleId: string; onAdd: () => void }) {
  const s = useSortable({ id: `drop:${moduleId}`, data: { type: "module", id: moduleId } });
  return (
    <button ref={s.setNodeRef} type="button" onClick={onAdd}
      className={cn("my-1 flex h-8 w-full items-center gap-2 rounded-md px-2 text-[12px] text-ink-500 hover:text-brand-300", s.isOver && "bg-brand-500/10 text-brand-300")}>
      <Plus size={13} /> Adicionar aula
    </button>
  );
}

function LessonItem({ lesson: l, moduleId, selected, renaming, setRenaming, onDelete }: {
  lesson: Lesson;
  moduleId: string;
  selected: boolean;
  renaming: boolean;
  setRenaming: (id: string | null) => void;
  onDelete: () => void;
}) {
  const { apply, selectLesson } = useEditor.getState();
  const sortable = useSortable({ id: `l:${l.id}`, data: { type: "lesson", id: l.id, moduleId, title: l.title } });
  const style = { transform: CSS.Translate.toString(sortable.transform), transition: sortable.transition };

  return (
    <div ref={sortable.setNodeRef} style={style} {...sortable.attributes} {...sortable.listeners}
      className={cn("group relative my-0.5 flex h-8 cursor-pointer items-center gap-2 rounded-md pl-2 pr-1 text-[13px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50",
        selected ? "bg-brand-500/15 text-white" : "text-ink-300 hover:bg-ink-800/70 hover:text-ink-100",
        sortable.isDragging && "opacity-40")}
      onClick={() => !renaming && selectLesson(l.id)}
      onDoubleClick={() => setRenaming(l.id)}
      aria-current={selected ? "page" : undefined}>
      {selected && <span className="absolute -left-[7px] top-1.5 bottom-1.5 w-0.5 rounded bg-brand-400" />}
      <FileText size={14} className={cn("shrink-0", selected ? "text-brand-300" : "text-ink-500")} />
      {renaming ? (
        <InlineRename value={l.title} onCancel={() => setRenaming(null)} onSubmit={(v) => { apply((d) => ops.renameLesson(d as Course, l.id, v)); setRenaming(null); }} />
      ) : (
        <span className="flex-1 truncate">{l.title}</span>
      )}
      {!renaming && <span className="text-[10.5px] text-ink-600 group-hover:hidden">{l.blocks.length || ""}</span>}
      {!renaming && (
        <div className="hidden group-hover:flex" onPointerDown={(e) => e.stopPropagation()}>
          <Menu width={180}
            trigger={(p) => <IconButton label="Opções da aula" size="sm" className="h-6 w-6" {...p}><MoreHorizontal size={14} /></IconButton>}
            items={[
              { label: "Renomear", icon: <Pencil />, onSelect: () => setRenaming(l.id) },
              { label: "Duplicar aula", icon: <Copy />, onSelect: () => apply((d) => { ops.duplicateLesson(d as Course, l.id); }) },
              { label: "", separator: true },
              { label: "Excluir aula", icon: <Trash2 />, danger: true, onSelect: onDelete },
            ]} />
        </div>
      )}
    </div>
  );
}
