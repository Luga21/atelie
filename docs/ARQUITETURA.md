# Ateliê — Documentação técnica

Plataforma standalone de autoria de treinamentos e-learning baseada em blocos.
Este documento descreve a arquitetura, as decisões técnicas e como estender o sistema.
**Mantenha-o atualizado a cada entrega.**

---

## 1. Stack e decisões

| Tema | Escolha | Motivo |
|---|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript | Pedido no briefing; `output: "export"` gera um site estático (sem backend) |
| Estilo do app | Tailwind CSS v4 | Chrome do editor/dashboard |
| Estilo do conteúdo | `src/styles/course.css` (CSS puro + variáveis de tema) | **Portável**: o mesmo CSS vai para o HTML exportado, sem depender do Tailwind |
| Componentes de UI | Primitivas próprias em `src/ui/` (abordagem shadcn) | Evita ~10 dependências Radix; identidade visual própria |
| Estado | Zustand + Immer | Store simples; Immer dá imutabilidade com compartilhamento estrutural (histórico barato) |
| Drag and drop | dnd-kit (core + sortable) | Acessível (teclado), sem dependência de DOM nativo de HTML5 DnD |
| Persistência | IndexedDB via `idb` | Suporta Blobs (imagens/vídeos) e volume grande; localStorage só para progresso do aluno |
| Exportação ZIP | fflate | Pequeno e rápido |
| Player exportado | esbuild (`scripts/build-runtime.mjs`) | Empacota o **mesmo** player do preview em `public/runtime/player.js` |

Rotas usam query string (`/editor?id=…`, `/preview?id=…`) porque, com export estático, rotas dinâmicas exigiriam conhecer os ids no build.

## 2. Estrutura de pastas

```
src/
  app/                    Rotas Next (finas): / (dashboard), /editor, /preview
  core/
    model/                Modelo de dados (types), fábrica, migração/normalização (schema), regras de negócio puras (operations)
    theme/                Tipos de tema, presets, fontes, conversão tema → variáveis CSS, ThemeScope
    richtext/             Sanitização de HTML por lista de permissões
  blocks/                 MOTOR DE BLOCOS
    engine/               Contrato (definition), registro (registry), contextos de renderização (context)
    common/               Primitivas compartilhadas: EditableText, RichText, MediaImage, BlockFrame
    library/<categoria>/  definitions.ts (puro) · views.tsx (canvas+player) · inspectors.tsx (editor)
    definitions.ts        Registro central dos tipos
    views.ts              Mapa tipo → View  (único código visual de blocos que vai para o player)
    editorKit.tsx         Mapa tipo → Inspector, ícone, prévia  (só editor)
    BlockRenderer.tsx     Renderiza qualquer bloco a partir do registro
    editor-ui/            Campos reutilizáveis dos painéis de propriedades
  features/
    dashboard/            Gestão de treinamentos e pastas
    editor/               Editor: TopBar, structure/ (sidebar), canvas/, panels/, state/ (store, autosave)
    player/               Player do aluno + rastreamento de progresso (adaptadores)
    preview/              Moldura de preview com modos desktop/tablet/celular
  storage/                IndexedDB (db), repositórios (repository), resolvedor de mídias
  export/                 JSON (projeto editável), HTML (pacote zip), catálogo de formatos
  runtime/standalone.tsx  Entrada do player exportado
  styles/course.css       Estilos do conteúdo e do player
  ui/                     Primitivas de interface do app
scripts/
  build-runtime.mjs       Compila o player standalone (build único ou --watch)
  dev.mjs                 Dev: runtime em watch + next dev
```

### Fronteiras (quem pode importar quem)

```
core  ←  blocks/engine, blocks/library/*/definitions   (puro, sem React no core/model)
blocks/views + common  →  usados por  features/player  e  features/editor/canvas
blocks/editorKit + inspectors + editor-ui  →  usados SÓ por features/editor
features/player  →  NUNCA importa editor, storage ou Next.js
runtime/standalone → player + views (o bundle exportado não contém nada do editor)
```

## 3. Modelo de dados

```ts
Course   { schemaVersion, id, title, description, cover, theme, modules[], status, folderId, createdAt, updatedAt }
Module   { id, title, lessons[] }
Lesson   { id, title, blocks[] }
Block    { id, type, version, content, settings, style }
MediaRef { kind: "asset", id } | { kind: "url", url }
```

- `content`: dados de conteúdo do bloco (textos, itens, mídias).
- `settings`: configurações específicas do tipo (visual e comportamento).
- `style`: configurações visuais **comuns** (fundo, espaçamento, largura) — sempre tokens do tema, nunca cores livres.
- `version`: versão da definição que gerou os dados; base das migrações.
- Mídias nunca são embutidas no documento: ficam em `assets` (IndexedDB) e o bloco guarda só a referência.
- O conteúdo de um bloco **nunca referencia ids de fora dele** (ex.: a alternativa correta é `option.correct = true`). Referências **internas** são permitidas — o cenário ramificado liga `choice.target → scene.id` — porque duplicar um bloco troca apenas o id do bloco e preserva os ids internos. Isso mantém duplicação e importação triviais e seguras.

Separação exigida no briefing:

| Dado | Onde |
|---|---|
| Treinamento / módulos / aulas | `Course.modules` (core/model) |
| Blocos | `Lesson.blocks` |
| Configurações visuais | `Course.theme` (global) + `Block.style` (tokens por bloco) |
| Estado do editor | `features/editor/state/editorStore.ts` (seleção, painéis, histórico) — nunca persistido |
| Renderização | `blocks/views.ts` + `BlockRenderer` |

### Evolução sem quebrar treinamentos

Todo documento que entra (IndexedDB ou importação) passa por `normalizeCourse()`:
1. Migrações de esquema do curso (`COURSE_MIGRATIONS`, por `schemaVersion`).
2. Para cada bloco, `normalizeBlock()`: aplica `definition.migrate()` se `block.version < definition.version` e completa chaves novas de `content`/`settings` com os padrões da definição.
3. Blocos de tipo desconhecido são preservados intactos e renderizados como aviso (não se perde dado).

## 4. Motor de blocos

Cada tipo de bloco tem três partes:

| Parte | Arquivo | Conteúdo |
|---|---|---|
| Definição (pura) | `library/<cat>/definitions.ts` | `type`, `version`, categoria, nome, descrição, palavras-chave, `create()` (padrões), `migrate()`, `scoring` |
| View | `library/<cat>/views.tsx` | Renderização com `mode: "edit"` (canvas) ou `"view"` (player) |
| Kit de edição | `library/<cat>/inspectors.tsx` + `editorKit.tsx` | Inspector (painel), ícone, prévia na biblioteca |

**Canvas e player compartilham a mesma View** (com `mode`), o que garante que o canvas seja uma representação fiel do resultado e evita duplicar componentes. Onde a edição precisa de outra estrutura, a View ramifica internamente (ex.: atividades mostram gabarito editável no canvas e o fluxo de resposta no player; flashcards mostram frente e verso lado a lado no canvas).

### Catálogo atual (28 tipos)

| Categoria | Blocos (`type`) | Pasta |
|---|---|---|
| Conteúdo | `heading`, `text`, `list`, `quote`, `image`, `text-image`, `video`, `divider` | `library/content` |
| Conteúdo (mídia) | `gallery` (grade/carrossel + lightbox), `audio` (com transcrição) | `library/media` |
| Interatividade | `accordion`, `tabs`, `flashcards`, `process` | `library/interactive` |
| Interatividade (exploração) | `reveal-cards`, `hotspots` (imagem com marcadores arrastáveis), `timeline` | `library/explore` |
| Atividades | `multiple-choice`, `multiple-select`, `true-false` | `library/activity` |
| Atividades | `matching` (associação, nota proporcional), `sorting` (arrastar e soltar, acessível por teclado/setas), `open-question` (sem nota) | `library/practice` |
| Estrutura | `columns` (2/3), `table` | `library/content`, `library/explore` |
| Experiências | `scenario` (cenário ramificado), `gate` (etapa com desbloqueio), `performance` (feedback de desempenho) | `library/experience` |

A View recebe `update(recipe, coalesceKey?)` apenas no editor.

### Contextos disponíveis para as Views

| Contexto | Fornecido por | Uso |
|---|---|---|
| `MediaResolverContext` | editor, preview, runtime | Resolver `MediaRef` → URL |
| `EditorServicesContext` | editor | Upload de mídia a partir do canvas |
| `ActivityReporterContext` | player | Ler/gravar resultados de atividades |
| `LessonScopeContext` | player (`LessonPage`) | Ids das atividades da aula/curso, atividades antes de um bloco, estado das etapas com desbloqueio |

Blocos que o aluno "responde" declaram `scoring` na definição — é isso que os inclui no progresso, no `performance` e na verificação do `gate`. `maxScore` 0 significa "conta como concluída, sem nota".

**Etapas com desbloqueio:** a `LessonPage` renderiza os blocos só até o primeiro `gate` ainda fechado (inclusive). A aula só pode ser concluída (sentinela de fim e rodapé de navegação) depois de liberar todas as etapas. As etapas liberadas ficam em `ProgressState.unlockedGates`. As primitivas `EditableText` e `RichText` viram áreas `contentEditable` em `mode="edit"` e conteúdo estático em `mode="view"`.

### Como adicionar um novo tipo de bloco

1. Em `library/<categoria>/definitions.ts`, declare tipos de `content`/`settings` e exporte uma `BlockDefinition` com `type` único e `version: 1`.
2. Adicione-a ao array em `blocks/definitions.ts`.
3. Crie a View em `views.tsx` e registre em `blocks/views.ts`.
4. Crie o Inspector em `inspectors.tsx` (use os campos de `editor-ui/fields.tsx`) e registre em `blocks/editorKit.tsx` com ícone, cor e prévia.
5. Estilos em `styles/course.css` usando apenas variáveis do tema (`--c-*`, `--f-*`, `--radius*` …).
6. Se for avaliativo, implemente `scoring.maxScore` e reporte resultados com `useActivityReporter()`.

Para mudar o formato de um bloco existente: incremente `version` e implemente `migrate(data, fromVersion)`.

## 5. Editor

- **Store** (`editorStore.ts`): `apply(recipe, coalesceKey)` é a única porta de alteração. Cada chamada gera um snapshot no histórico; chamadas com a mesma `coalesceKey` em menos de 1,2 s são agrupadas (digitar uma palavra = um passo de desfazer). Limite de 150 passos.
- **Regras de negócio** ficam em `core/model/operations.ts` (funções puras sobre o rascunho do Immer). Atenção: nunca guardar o rascunho fora da receita — ele é revogado; capture apenas ids.
- **Autosave** (`useAutosave.ts`): observa o store, grava com debounce de 700 ms, força gravação ao ocultar a aba/sair, e expõe o status (pendente/salvando/salvo/erro) na barra superior.
- **Modelo híbrido de edição**: texto inline no canvas (com barra flutuante de formatação para `[data-rte]`), inserção contextual entre blocos (biblioteca aberta no próprio fluxo, sem modal), e painel lateral contextual (aba Configurações = Inspector do tipo; aba Estilo = estilo comum).
- **Atalhos**: Ctrl+Z / Ctrl+Shift+Z (ou Ctrl+Y), Ctrl+D duplica, Delete exclui o bloco selecionado, Esc fecha a biblioteca/desseleciona.

## 6. Sistema de temas

`Theme = { colors, typography, components, layout }` → `themeToCssVars()` gera variáveis CSS aplicadas na raiz `.cr` por `ThemeScope`, e `themeDataAttrs()` ativa variações (`data-btn`, `data-card`, `data-interactive`). Canvas, preview e exportação usam o mesmo `ThemeScope`, então qualquer alteração aparece imediatamente no canvas. Cores de texto sobre a primária são calculadas por contraste (WCAG). Fontes são carregadas do Google Fonts conforme o tema.

Responsividade do conteúdo usa **container queries** (`container-name: course`), de modo que o preview em tablet/celular se comporta como em um dispositivo real e o canvas reflete a largura disponível.

## 7. Armazenamento

IndexedDB `atelie-authoring` (v1): `courses`, `summaries` (resumo para o dashboard), `assets` (Blobs indexados por curso), `folders`.
A aplicação conhece apenas as interfaces `CourseRepository`, `AssetRepository`, `FolderRepository` (`storage/repository.ts`). Para migrar para nuvem, implemente-as sobre uma API e troque a instância — nenhuma tela muda.
Duplicar um curso copia suas mídias e remapeia referências (`remapAssetIds`, genérico para qualquer bloco). Excluir remove as mídias.

## 8. Player e progresso

`CoursePlayer` recebe `course`, um `MediaResolver` e um `ProgressAdapter`:
- capa (3 estilos), sumário, aulas, navegação lateral ou superior, barra de progresso, anterior/próxima, tela de conclusão com aproveitamento;
- uma aula é concluída quando o aluno chega ao fim do conteúdo (IntersectionObserver) ou avança;
- atividades reportam `{score, maxScore, passed, attempts, response, completed}` via `ActivityReporter`, e o estado é restaurado ao voltar.

Adaptadores: `createMemoryProgress` (preview), `createLocalProgress` (HTML exportado, localStorage) e `createScormProgress` (pacotes SCORM).

### SCORM 1.2 e 2004 (`features/player/scorm/`)

O runtime lê `window.__EXPORT_TARGET__` (gravado em `data/course.js`). Em `scorm12`/`scorm2004` ele procura a API do LMS (`API` / `API_1484_11`) nas janelas ancestrais e na que abriu o curso (`api.ts`). Se a API não existir, usa o progresso local e mostra um aviso — útil para o autor abrir o zip sem LMS.

| Player | SCORM 1.2 | SCORM 2004 |
|---|---|---|
| `ProgressState` (compacto) | `cmi.suspend_data` (≤ 4.096) | `cmi.suspend_data` (≤ 64.000) |
| aula atual | `cmi.core.lesson_location` | `cmi.location` |
| aulas concluídas | `cmi.core.lesson_status` | `cmi.completion_status` + `cmi.progress_measure` |
| nota (0–100) | `cmi.core.score.raw/min/max` | `cmi.score.scaled/raw/min/max` |
| aprovação | `lesson_status` = `passed`/`failed` | `cmi.success_status` |
| fim da sessão | `session_time` (HHHH:MM:SS.SS), `exit=suspend`, `LMSFinish` | `session_time` (ISO 8601), `exit=suspend`, `Terminate` |

Regras de status:
- Na primeira entrada: `incomplete`.
- **Concluído** = todas as aulas concluídas.
- **Aprovado/reprovado** só existe se o curso tiver atividades com nota: concluído e `nota ≥ course.lms.passingScore` → aprovado. Sem atividades com nota, o 1.2 registra apenas `completed` e o 2004 mantém `success_status=unknown`.
- A nota considera todas as atividades com nota do curso, inclusive acerto parcial (associação).

`suspend.ts` serializa o progresso de forma compacta, usando os últimos 6 caracteres dos ids em vez de posições, para que a retomada sobreviva a uma republicação com conteúdo reordenado. Se passar do limite, descarta em etapas: primeiro as respostas (restauração visual), depois a posição e as etapas liberadas, mantendo sempre aulas concluídas e notas.

Os commits ao LMS ficam agrupados em 800 ms. Ao sair (`pagehide`/`beforeunload`), o adaptador grava a duração e encerra a sessão uma única vez.

**Manifest** (`export/scorm.ts`): um único SCO (`index.html`) com todos os arquivos listados. O identificador é `course.lms.identifier`, estável entre exportações para o LMS reconhecer atualizações e trocado ao duplicar o curso. A nota mínima vai para `adlcp:masteryscore` (1.2) ou `imsss:minNormalizedMeasure` com `satisfiedByMeasure` (2004), e só é incluída se houver atividades com nota. Os arquivos XSD dos esquemas não são incluídos no zip: os LMS usuais (Moodle, SCORM Cloud, Canvas, TalentLMS) aceitam sem eles, mas validadores estritos de conformidade podem avisar.

## 9. Exportação

- **JSON** (`export/json.ts`): `{ format: "atelie-course", formatVersion, course, assets: {id: {name, mime, data(base64)}} }`. A importação valida o formato, normaliza/migra, gera novos ids de curso e de mídia (nunca sobrescreve) e grava tudo.
- **HTML** (`export/html.ts`): zip com `index.html`, `assets/player.js|css`, `data/course.js` e `media/*`. Os dados vão em `.js` (não `.json`) para funcionar abrindo o `index.html` direto do disco (`file://`). O HTML é serializado com escape seguro para `<script>`.
- **SCORM 1.2 / 2004** (`export/scorm.ts`): o mesmo pacote HTML com `__EXPORT_TARGET__` SCORM e `imsmanifest.xml` na raiz (ver seção 8). A nota mínima fica em Treinamento → LMS (SCORM).
- Todo texto rico é sanitizado ao editar **e** ao renderizar (`core/richtext/sanitize.ts`).

## 10. Publicação e app instalável

- **Hospedagem:** GitHub Pages, via `.github/workflows/deploy.yml` (build + deploy a cada push na `main`).
- **Caminho base:** `NEXT_PUBLIC_BASE_PATH` (ex.: `/atelie`) configura `basePath` no Next. URLs montadas à mão usam `withBase()` (`core/env.ts`): busca do player na exportação, manifesto e service worker. `next/link` e `router.push` já aplicam o caminho sozinhos. `trailingSlash: true` gera `editor/index.html`, compatível com qualquer servidor estático.
- **PWA:**
  - `app/manifest.ts` (nome, cores, ícones `any` e `maskable`), `app/icon.png` e `app/apple-icon.png`, gerados por `scripts/generate-icons.mjs`.
  - `public/sw.js` usa estratégia rede-primeiro com fallback ao cache: o app abre offline depois do primeiro uso e nunca fica preso numa versão antiga. As páginas são guardadas no cache sem a query (`?id=`).
  - O registro do service worker acontece só no build de produção (`features/app/AppSetup.tsx`).
- **Armazenamento persistente:** `navigator.storage.persist()` é solicitado ao abrir o app. Chrome e Edge concedem para sites instalados, favoritados ou muito usados; o dashboard mostra o estado e orienta a instalar o app.
- **Origem:** o IndexedDB é por origem (`https://conta.github.io`). O nome do banco (`atelie-authoring`) evita colisão com outros sites da mesma conta, mas mudar de conta ou domínio "perde" os dados. A migração é feita por exportação e importação em JSON.

Validado localmente com `NEXT_PUBLIC_BASE_PATH=/atelie` + `npm run preview:pages`: dashboard, criação e edição sob `/atelie/editor/?id=…`, reabertura com dados preservados, manifesto e ícones servidos sob a subpasta, service worker com escopo `/atelie/`, player de exportação em `/atelie/runtime/` e abertura do editor com o servidor desligado (offline).

## 11. Desenvolvimento

```bash
npm install
npm run dev          # runtime do player em watch + Next em http://localhost:3000
npm run typecheck
npm run build        # gera out/ (site estático) e public/runtime/
```

Em desenvolvimento, o editor expõe `window.__atelieDebug` (`getCourse`, `buildHtmlPackage`, `buildScormPackage`, `buildProjectFile`, `importCourseJson`) para testes automatizados no navegador.

## 12. Status das fases

| Fase | Status |
|---|---|
| 1 — Fundação e editor (dashboard, estrutura, canvas, inserção, edição inline, painel, DnD, salvamento) | ✅ |
| 2 — Motor de blocos (registro, edição/renderização, biblioteca, duplicar/excluir, configurações) | ✅ |
| 3 — Conteúdo (texto, título, imagem, texto+imagem, vídeo, lista, colunas 2/3, citação, divisor) | ✅ |
| 4 — Interatividade (acordeão, abas, flashcards, processo, múltipla escolha/seleção, V/F, feedback) | ✅ |
| 5 — Temas (presets, cores, tipografia, componentes, layout) | ✅ |
| 6 — Player (navegação, progresso, responsividade, conclusão) | ✅ |
| 7 — Exportação (JSON, HTML, SCORM 1.2, SCORM 2004) | ✅ (SCORM validado contra LMS simulado; ainda não testado num LMS real) |
| 8 — Blocos adicionais (galeria, áudio, cards clicáveis, marcadores, linha do tempo, tabela, associação, ordenar, pergunta aberta, cenário ramificado, etapa com desbloqueio, feedback de desempenho) | ✅ |

### Validação realizada (navegador, ponta a ponta)
Criar treinamento → inserir os 16 tipos de bloco → editar inline → configurar pelo painel → reordenar blocos e aulas por arraste (mouse real) → duplicar/excluir → desfazer/refazer → trocar tema → recarregar (persistência) → preview com interações (acordeão, abas, flip, etapas, tentativas, feedback, pontuação, conclusão) → modo celular (drawer, colunas) → upload de imagem → export/import JSON com mídia → pacote HTML executado isolado → `npm run build`.

Fase 8, também validada no navegador: os 12 novos blocos inseridos e editados no canvas (upload múltiplo na galeria, criar e arrastar marcadores) → no player, lightbox com navegação, progresso de exploração, associação errada → nova tentativa (mantém pares corretos) → correta, ordenação por arraste real com o mouse e por setas, pergunta aberta com tamanho mínimo e resposta de referência, etapa bloqueada até concluir as atividades e depois liberada, cenário com desfecho negativo e depois positivo, painel de desempenho atualizado em tempo real → modo celular sem rolagem horizontal → pacote HTML com todas as mídias mapeadas.

SCORM, validado com uma API SCORM simulada que rejeita valores fora do vocabulário, do formato ou do limite de tamanho: manifests 1.2 e 2004 bem formados, com todos os arquivos listados → sessão 1 (`incomplete`, nota, `suspend_data` de ~90 caracteres, `exit`/`session_time`/finish ao fechar) → sessão 2 retoma na mesma aula com a resposta restaurada → conclusão gera `failed` com mínimo de 70% e `passed` com 10% → 2004 com `completion`/`success` separados, `score.scaled` e `progress_measure` → resposta de 5.000 caracteres no 1.2 mantém o `suspend_data` dentro do limite → pacote aberto sem LMS usa o progresso local e mostra aviso. Nenhum valor foi rejeitado pela API simulada.

### Próximos passos sugeridos
- Testar os pacotes SCORM em um LMS real (SCORM Cloud, Moodle) e, se necessário, incluir os XSD no zip.
- Registro de interações SCORM (`cmi.interactions`) por atividade, para relatórios detalhados no LMS.
- Blocos ainda não cobertos do briefing: diagramas/fluxogramas, quiz com várias perguntas e nota de corte, categorização (arrastar para grupos).
- Biblioteca de mídias por curso (reutilizar uploads) e limpeza de assets órfãos.
- Testes automatizados (Vitest para `core/` e `blocks/*/definitions`, Playwright para os fluxos acima).
