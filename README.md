# Ateliê

Ferramenta de autoria de treinamentos e-learning: editor visual baseado em blocos, temas
personalizáveis, player responsivo e exportação em HTML independente, SCORM 1.2/2004 e JSON.

## Para o time de T&D (uso)

1. Acesse o endereço publicado: `https://<conta>.github.io/<repositório>/`.
2. **Instale como aplicativo** (recomendado): no Edge ou no Chrome, clique no ícone de instalar na barra de
   endereço (ou menu ⋯ → *Aplicativos* → *Instalar Ateliê*). O app ganha ícone na área de trabalho e no menu
   Iniciar, abre em janela própria e funciona offline.
3. Os treinamentos ficam salvos **neste computador, neste navegador**:
   - fechar o navegador ou desligar o computador não apaga nada; o salvamento é automático;
   - limpar os dados de navegação do site, ou usar janela anônima, apaga os treinamentos;
   - para levar um curso a outra pessoa ou a outro computador: no painel, menu ⋯ do curso → *Exportar JSON*;
     do outro lado, *Importar*;
   - faça backups em JSON periodicamente.

## Publicação no GitHub Pages (uma vez)

O repositório já contém o workflow `.github/workflows/deploy.yml`, que gera e publica o site a cada push na branch `main`.

1. Crie um repositório no GitHub (público, no plano gratuito) — ex.: `atelie`.
2. Envie o código:
   ```bash
   git remote add origin https://github.com/<conta>/atelie.git
   git push -u origin main
   ```
3. No GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Acompanhe na aba **Actions**. Ao terminar, o site estará em `https://<conta>.github.io/atelie/`.

A partir daí, cada push na `main` publica uma nova versão; o time recebe a atualização ao reabrir o app.

> **Atenção ao endereço:** os treinamentos ficam vinculados ao endereço do site. Se o repositório for
> renomeado ou movido para outra conta, o endereço muda e os cursos não aparecem no novo — peça ao time
> para exportar os cursos em JSON antes e importar depois.

## Desenvolvimento

Requer Node.js 20.9+.

```bash
npm install
npm run dev
```

Acesse http://localhost:3000.

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento + recompilação do player exportável |
| `npm run build` | Site estático em `out/` (use `NEXT_PUBLIC_BASE_PATH=/atelie` para simular o Pages) |
| `npm run preview:pages` | Serve `out/` em http://localhost:4173/atelie/, como o GitHub Pages |
| `npm run typecheck` | Verificação de tipos |
| `npm run icons` | Regenera os ícones do app a partir do logo |

## Documentação

Arquitetura, modelo de dados, motor de blocos, SCORM e como criar novos blocos: [docs/ARQUITETURA.md](docs/ARQUITETURA.md).
