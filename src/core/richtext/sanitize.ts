/**
 * Sanitização de HTML de texto rico por lista de permissões.
 * Aplicada ao salvar (editor) e ao renderizar (player), protegendo contra
 * conteúdo malicioso vindo de colagens ou de arquivos JSON importados.
 */
const ALLOWED = new Set(["P", "BR", "STRONG", "B", "EM", "I", "U", "S", "A", "UL", "OL", "LI", "MARK"]);
const RENAME: Record<string, string> = { DIV: "p", H1: "p", H2: "p", H3: "p", H4: "p", H5: "p", H6: "p" };

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function safeHref(href: string | null): string | null {
  if (!href) return null;
  const v = href.trim();
  if (/^(https?:|mailto:|tel:|#)/i.test(v)) return v;
  if (/^[\w.-]+\.[a-z]{2,}/i.test(v)) return `https://${v}`;
  return null;
}

function cleanNode(node: Node, doc: Document): Node[] {
  if (node.nodeType === Node.TEXT_NODE) return [doc.createTextNode(node.textContent ?? "")];
  if (node.nodeType !== Node.ELEMENT_NODE) return [];
  const el = node as Element;
  const children = () => [...el.childNodes].flatMap((c) => cleanNode(c, doc));
  if (["SCRIPT", "STYLE", "IFRAME", "OBJECT", "TEMPLATE", "META", "LINK"].includes(el.tagName)) return [];
  const tag = RENAME[el.tagName] ?? (ALLOWED.has(el.tagName) ? el.tagName.toLowerCase() : null);
  if (!tag) return children(); // desembrulha elementos desconhecidos mantendo o conteúdo
  const out = doc.createElement(tag);
  if (tag === "a") {
    const href = safeHref(el.getAttribute("href"));
    if (!href) return children();
    out.setAttribute("href", href);
    out.setAttribute("target", "_blank");
    out.setAttribute("rel", "noopener noreferrer");
  }
  children().forEach((c) => out.appendChild(c));
  return [out];
}

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  if (typeof DOMParser === "undefined") return escapeHtml(html.replace(/<[^>]*>/g, ""));
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const out = doc.createElement("div");
  [...doc.body.childNodes].flatMap((n) => cleanNode(n, doc)).forEach((n) => out.appendChild(n));
  // Remove parágrafos vazios no fim, gerados por edição.
  return out.innerHTML.replace(/(<p>(<br>)?<\/p>)+$/g, "").trim();
}

export function htmlToText(html: string): string {
  return html.replace(/<br\s*\/?>/gi, " ").replace(/<\/(p|li)>/gi, " ").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
