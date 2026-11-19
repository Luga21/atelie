/*
 * Service worker do Ateliê.
 * Estratégia "rede primeiro": sempre busca a versão mais nova publicada e guarda uma cópia;
 * sem conexão, usa a cópia. Assim o app abre offline depois do primeiro uso, sem nunca
 * prender o time numa versão antiga. Os treinamentos NÃO passam por aqui (ficam no IndexedDB).
 */
const CACHE = "atelie-app-v1";
const SCOPE = new URL(self.registration.scope).pathname; // ex.: "/atelie/"

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll([SCOPE, `${SCOPE}editor/`, `${SCOPE}preview/`]).catch(() => undefined)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("atelie-app-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE)) return;

  // Páginas: a chave ignora a query (?id=…), pois o HTML é o mesmo para todos os cursos.
  const isPage = req.mode === "navigate";
  const key = isPage ? `${url.origin}${url.pathname}` : req;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(key, copy));
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(key, { ignoreSearch: isPage });
        if (cached) return cached;
        if (isPage) return (await caches.match(SCOPE)) ?? Response.error();
        return Response.error();
      }),
  );
});
