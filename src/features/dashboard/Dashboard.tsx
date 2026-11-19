"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Copy, Download, Eye, Folder as FolderIcon, FolderInput, FolderPlus, Inbox, LayoutGrid, MoreHorizontal, Pencil,
  Plus, Search, Trash2, Upload,
} from "lucide-react";
import { MediaResolverContext, useMediaUrl } from "@/blocks/engine/context";
import { createCourse } from "@/core/model/factory";
import { uid } from "@/core/model/ids";
import { STATUS_LABEL, type CourseStatus, type CourseSummary, type Folder } from "@/core/model/types";
import { exportCourseJson, importCourseJson } from "@/export/json";
import { getStorageInfo } from "@/features/app/AppSetup";
import { localAssetResolver } from "@/storage/assetResolver";
import { courseRepository, folderRepository } from "@/storage/repository";
import { cn } from "@/ui/cn";
import { relativeTime } from "@/ui/format";
import { Button, Dialog, IconButton, Input, Logo, Menu, Select, Textarea, toast } from "@/ui/primitives";

type FolderFilter = "all" | "none" | string;

const STATUS_STYLE: Record<CourseStatus, string> = {
  draft: "bg-ink-700/80 text-ink-200",
  review: "bg-amber-500/15 text-amber-300",
  published: "bg-emerald-500/15 text-emerald-300",
};

export function Dashboard() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseSummary[] | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState<FolderFilter>("all");
  const [status, setStatus] = useState<CourseStatus | "all">("all");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<CourseSummary | null>(null);
  const [moving, setMoving] = useState<CourseSummary | null>(null);
  const [folderDialog, setFolderDialog] = useState<{ mode: "create" } | { mode: "rename"; folder: Folder } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      const [c, f] = await Promise.all([courseRepository.list(), folderRepository.list()]);
      setCourses(c);
      setFolders(f);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("pt-BR");
    return (courses ?? []).filter(
      (c) =>
        (folder === "all" || (folder === "none" ? !c.folderId : c.folderId === folder)) &&
        (status === "all" || c.status === status) &&
        (!q || c.title.toLocaleLowerCase("pt-BR").includes(q) || c.description.toLocaleLowerCase("pt-BR").includes(q)),
    );
  }, [courses, folder, status, query]);

  const countIn = (f: FolderFilter) =>
    (courses ?? []).filter((c) => f === "all" || (f === "none" ? !c.folderId : c.folderId === f)).length;

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const c = await importCourseJson(file);
      toast(`“${c.title}” importado com sucesso`, "success");
      await refresh();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  };

  const currentFolderName =
    folder === "all" ? "Todos os treinamentos" : folder === "none" ? "Sem pasta" : folders.find((f) => f.id === folder)?.name ?? "Pasta";

  return (
    <MediaResolverContext.Provider value={localAssetResolver}>
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-ink-800 bg-ink-900/60 px-3 py-4">
          <div className="px-2 pb-6"><Logo /></div>
          <nav className="space-y-0.5">
            <SideItem icon={<LayoutGrid size={16} />} label="Todos os treinamentos" count={countIn("all")} active={folder === "all"} onClick={() => setFolder("all")} />
            <SideItem icon={<Inbox size={16} />} label="Sem pasta" count={countIn("none")} active={folder === "none"} onClick={() => setFolder("none")} />
          </nav>
          <div className="mt-6 flex items-center justify-between px-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Pastas</span>
            <IconButton label="Nova pasta" size="sm" onClick={() => setFolderDialog({ mode: "create" })}><FolderPlus size={15} /></IconButton>
          </div>
          <nav className="mt-1 space-y-0.5 overflow-y-auto scroll-thin">
            {folders.length === 0 && <p className="px-2.5 py-2 text-xs text-ink-500">Organize treinamentos em pastas por área, cliente ou trilha.</p>}
            {folders.map((f) => (
              <div key={f.id} className="group relative">
                <SideItem icon={<FolderIcon size={16} />} label={f.name} count={countIn(f.id)} active={folder === f.id} onClick={() => setFolder(f.id)} />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                  <Menu
                    width={180}
                    trigger={(p) => <IconButton label="Opções da pasta" size="sm" {...p}><MoreHorizontal size={15} /></IconButton>}
                    items={[
                      { label: "Renomear", icon: <Pencil />, onSelect: () => setFolderDialog({ mode: "rename", folder: f }) },
                      {
                        label: "Excluir pasta", icon: <Trash2 />, danger: true, onSelect: async () => {
                          await folderRepository.remove(f.id);
                          if (folder === f.id) setFolder("all");
                          toast("Pasta excluída. Os treinamentos foram mantidos.");
                          refresh();
                        },
                      },
                    ]}
                  />
                </div>
              </div>
            ))}
          </nav>
          <StorageNote />
        </aside>

        {/* Conteúdo */}
        <main className="flex-1 overflow-y-auto scroll-thin">
          <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-ink-800 bg-ink-950/85 px-6 py-3.5 backdrop-blur">
            <div className="md:hidden"><Logo /></div>
            <div className="relative max-w-md flex-1">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar treinamentos por nome…" className="pl-9" aria-label="Buscar treinamentos" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <input ref={importRef} type="file" accept=".json,application/json" hidden onChange={(e) => onImport(e.target.files?.[0])} />
              <Button variant="ghost" onClick={() => importRef.current?.click()}><Upload size={15} /> <span className="hidden sm:inline">Importar</span></Button>
              <Button variant="primary" onClick={() => setCreating(true)}><Plus size={16} /> Novo treinamento</Button>
            </div>
          </header>

          <div className="mx-auto max-w-[1400px] px-6 py-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">{currentFolderName}</h1>
                <p className="mt-1 text-sm text-ink-400">
                  {courses ? `${filtered.length} ${filtered.length === 1 ? "treinamento" : "treinamentos"}` : "Carregando…"}
                </p>
              </div>
              <div className="flex gap-1.5" role="group" aria-label="Filtrar por status">
                {(["all", "draft", "review", "published"] as const).map((s) => (
                  <button key={s} type="button" onClick={() => setStatus(s)}
                    className={cn("h-8 rounded-full px-3.5 text-[13px] font-medium transition-colors border",
                      status === s ? "border-brand-500/60 bg-brand-500/15 text-brand-300" : "border-ink-700 text-ink-300 hover:text-white hover:border-ink-600")}>
                    {s === "all" ? "Todos" : STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="rounded-xl border border-red-800 bg-red-950/60 p-4 text-sm text-red-200">Não foi possível acessar o armazenamento local: {error}</p>}

            {courses && courses.length === 0 ? (
              <EmptyState onCreate={() => setCreating(true)} onImport={() => importRef.current?.click()} />
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
                {courses && folder !== "none" && !query && status === "all" && (
                  <button type="button" onClick={() => setCreating(true)}
                    className="group flex min-h-[290px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink-700 text-ink-400 transition-colors hover:border-brand-500/60 hover:bg-brand-500/5 hover:text-brand-300">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-ink-800 transition-colors group-hover:bg-brand-500/20"><Plus size={22} /></span>
                    <span className="text-sm font-medium">Criar treinamento</span>
                  </button>
                )}
                {filtered.map((c) => (
                  <CourseCard
                    key={c.id}
                    course={c}
                    folderName={folders.find((f) => f.id === c.folderId)?.name}
                    onOpen={() => router.push(`/editor?id=${c.id}`)}
                    onPreview={() => router.push(`/preview?id=${c.id}`)}
                    onDuplicate={async () => {
                      await courseRepository.duplicate(c.id);
                      toast("Treinamento duplicado", "success");
                      refresh();
                    }}
                    onExport={async () => {
                      const full = await courseRepository.get(c.id);
                      if (full) await exportCourseJson(full);
                    }}
                    onMove={() => setMoving(c)}
                    onDelete={() => setDeleting(c)}
                  />
                ))}
              </div>
            )}
            {courses && courses.length > 0 && filtered.length === 0 && (
              <p className="py-16 text-center text-sm text-ink-400">Nenhum treinamento encontrado com esses filtros.</p>
            )}
          </div>
        </main>
      </div>

      <CreateCourseDialog
        open={creating}
        folders={folders}
        defaultFolder={folder !== "all" && folder !== "none" ? folder : null}
        onClose={() => setCreating(false)}
        onCreate={async (input) => {
          const course = createCourse(input);
          await courseRepository.save(course);
          router.push(`/editor?id=${course.id}`);
        }}
      />

      <Dialog open={!!deleting} onClose={() => setDeleting(null)} title="Excluir treinamento?"
        description={`“${deleting?.title}” e todas as suas mídias serão removidos deste navegador. Esta ação não pode ser desfeita.`}>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleting(null)}>Cancelar</Button>
          <Button variant="danger" onClick={async () => {
            if (!deleting) return;
            await courseRepository.remove(deleting.id);
            setDeleting(null);
            toast("Treinamento excluído");
            refresh();
          }}>Excluir</Button>
        </div>
      </Dialog>

      <MoveDialog course={moving} folders={folders} onClose={() => setMoving(null)} onMoved={refresh} />

      <FolderDialog state={folderDialog} onClose={() => setFolderDialog(null)} onSaved={refresh} />
    </MediaResolverContext.Provider>
  );
}

function StorageNote() {
  const [info, setInfo] = useState<{ persisted: boolean; usageMB: number | null } | null>(null);
  useEffect(() => {
    // Pequeno atraso: o pedido de armazenamento persistente é feito no carregamento do app.
    const t = setTimeout(() => getStorageInfo().then(setInfo), 600);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="mt-auto space-y-1.5 px-2.5 text-[11px] leading-relaxed text-ink-500">
      {info && (
        <>
          <p className={cn("flex items-center gap-1.5", info.persisted ? "text-emerald-400/90" : "text-amber-300/90")}
            title={info.persisted ? "O navegador não apagará estes dados automaticamente." : "Em situações raras (disco quase cheio), o navegador pode limpar estes dados."}>
            <span className={cn("h-1.5 w-1.5 rounded-full", info.persisted ? "bg-emerald-400" : "bg-amber-300")} />
            {info.persisted ? "Armazenamento protegido" : "Armazenamento padrão"}
            {info.usageMB !== null && <span className="text-ink-500">· {info.usageMB.toLocaleString("pt-BR")} MB</span>}
          </p>
          {!info.persisted && (
            <p>Instale o app (ícone de instalar na barra de endereço) para proteger seus projetos contra limpeza automática.</p>
          )}
        </>
      )}
      <p>Seus projetos ficam salvos neste navegador. Exporte em JSON para fazer backup.</p>
    </div>
  );
}

function SideItem({ icon, label, count, active, onClick }: { icon: React.ReactNode; label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={cn("flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors",
        active ? "bg-ink-800 text-white" : "text-ink-300 hover:bg-ink-800/60 hover:text-white")}>
      <span className={active ? "text-brand-400" : "text-ink-500"}>{icon}</span>
      <span className="flex-1 truncate text-left">{label}</span>
      <span className="text-[11px] text-ink-500 group-hover:opacity-0">{count}</span>
    </button>
  );
}

function CourseCard({ course, folderName, onOpen, onPreview, onDuplicate, onExport, onMove, onDelete }: {
  course: CourseSummary;
  folderName?: string;
  onOpen: () => void;
  onPreview: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onMove: () => void;
  onDelete: () => void;
}) {
  const cover = useMediaUrl(course.cover);
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-800 bg-ink-900 transition-all hover:-translate-y-0.5 hover:border-ink-700 hover:shadow-2xl hover:shadow-black/40">
      <button type="button" onClick={onOpen} className="relative aspect-[16/9] overflow-hidden text-left" aria-label={`Editar ${course.title}`}>
        {cover ? (
          <img src={cover} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="h-full w-full" style={{ background: `radial-gradient(120% 120% at 100% 0%, ${course.primaryColor} 0%, #0d0e12 70%)` }}>
            <span aria-hidden className="absolute -bottom-6 right-3 select-none text-[120px] font-bold leading-none text-white/10">{course.title.trim().charAt(0).toUpperCase()}</span>
          </div>
        )}
        <span className={cn("absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur", STATUS_STYLE[course.status])}>
          {STATUS_LABEL[course.status]}
        </span>
      </button>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start gap-2">
          <Link href={`/editor?id=${course.id}`} className="flex-1 font-semibold leading-snug text-white hover:text-brand-300">{course.title}</Link>
          <Menu
            trigger={(p) => <IconButton label="Mais opções" size="sm" className="-mr-1 -mt-0.5" {...p}><MoreHorizontal size={16} /></IconButton>}
            items={[
              { label: "Editar", icon: <Pencil />, onSelect: onOpen },
              { label: "Visualizar como aluno", icon: <Eye />, onSelect: onPreview },
              { label: "Duplicar", icon: <Copy />, onSelect: onDuplicate },
              { label: "Mover para pasta…", icon: <FolderInput />, onSelect: onMove },
              { label: "Exportar JSON", icon: <Download />, onSelect: onExport },
              { label: "", separator: true },
              { label: "Excluir", icon: <Trash2 />, danger: true, onSelect: onDelete },
            ]}
          />
        </div>
        <p className="mt-1.5 line-clamp-2 min-h-[2.6em] text-[13px] leading-relaxed text-ink-400">{course.description || "Sem descrição"}</p>
        <div className="mt-auto flex items-center gap-2 pt-4 text-[12px] text-ink-500">
          <span>{course.moduleCount} {course.moduleCount === 1 ? "módulo" : "módulos"} · {course.lessonCount} {course.lessonCount === 1 ? "aula" : "aulas"}</span>
          <span className="ml-auto" title={new Date(course.updatedAt).toLocaleString("pt-BR")}>Editado {relativeTime(course.updatedAt)}</span>
        </div>
        {folderName && <span className="mt-2 inline-flex w-fit items-center gap-1 text-[11px] text-ink-400"><FolderIcon size={12} /> {folderName}</span>}
      </div>
    </article>
  );
}

function EmptyState({ onCreate, onImport }: { onCreate: () => void; onImport: () => void }) {
  return (
    <div className="mx-auto mt-10 max-w-lg rounded-3xl border border-ink-800 bg-gradient-to-b from-ink-900 to-ink-950 p-10 text-center">
      <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/15 text-brand-300"><LayoutGrid size={26} /></div>
      <h2 className="text-xl font-semibold text-white">Crie seu primeiro treinamento</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-400">
        Monte aulas com blocos de texto, mídia, interações e atividades. Tudo é salvo automaticamente neste navegador.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Button variant="primary" onClick={onCreate}><Plus size={16} /> Novo treinamento</Button>
        <Button variant="ghost" onClick={onImport}><Upload size={15} /> Importar JSON</Button>
      </div>
    </div>
  );
}

function CreateCourseDialog({ open, folders, defaultFolder, onClose, onCreate }: {
  open: boolean;
  folders: Folder[];
  defaultFolder: string | null;
  onClose: () => void;
  onCreate: (input: { title: string; description: string; folderId: string | null }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [folderId, setFolderId] = useState<string>(defaultFolder ?? "");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setFolderId(defaultFolder ?? "");
      setBusy(false);
    }
  }, [open, defaultFolder]);
  return (
    <Dialog open={open} onClose={onClose} title="Novo treinamento" description="Você poderá alterar tudo isso depois, no editor.">
      <form className="space-y-4" onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        await onCreate({ title, description, folderId: folderId || null });
      }}>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-200">Título</span>
          <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Onboarding de novos colaboradores" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-200">Descrição <span className="text-ink-500">(opcional)</span></span>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="O que o aluno vai aprender?" />
        </label>
        {folders.length > 0 && (
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-200">Pasta</span>
            <Select value={folderId} onChange={setFolderId} options={[{ value: "", label: "Sem pasta" }, ...folders.map((f) => ({ value: f.id, label: f.name }))]} />
          </label>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" type="submit" disabled={busy}>{busy ? "Criando…" : "Criar e abrir editor"}</Button>
        </div>
      </form>
    </Dialog>
  );
}

function MoveDialog({ course, folders, onClose, onMoved }: { course: CourseSummary | null; folders: Folder[]; onClose: () => void; onMoved: () => void }) {
  const [target, setTarget] = useState("");
  useEffect(() => setTarget(course?.folderId ?? ""), [course]);
  return (
    <Dialog open={!!course} onClose={onClose} title="Mover para pasta" description={course?.title}>
      {folders.length === 0 ? (
        <p className="text-sm text-ink-400">Crie uma pasta na barra lateral para organizar seus treinamentos.</p>
      ) : (
        <Select value={target} onChange={setTarget} options={[{ value: "", label: "Sem pasta" }, ...folders.map((f) => ({ value: f.id, label: f.name }))]} />
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" disabled={folders.length === 0} onClick={async () => {
          if (!course) return;
          const full = await courseRepository.get(course.id);
          if (full) await courseRepository.save({ ...full, folderId: target || null });
          onClose();
          onMoved();
        }}>Mover</Button>
      </div>
    </Dialog>
  );
}

function FolderDialog({ state, onClose, onSaved }: {
  state: { mode: "create" } | { mode: "rename"; folder: Folder } | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  useEffect(() => setName(state?.mode === "rename" ? state.folder.name : ""), [state]);
  return (
    <Dialog open={!!state} onClose={onClose} title={state?.mode === "rename" ? "Renomear pasta" : "Nova pasta"}>
      <form onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim() || !state) return;
        const folder = state.mode === "rename" ? { ...state.folder, name: name.trim() } : { id: uid("f"), name: name.trim(), createdAt: Date.now() };
        await folderRepository.save(folder);
        onClose();
        onSaved();
      }}>
        <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Operações, Vendas, Compliance" />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" type="submit" disabled={!name.trim()}>Salvar</Button>
        </div>
      </form>
    </Dialog>
  );
}
