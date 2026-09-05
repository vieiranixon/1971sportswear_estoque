/**
 * Service worker do Estoque 1971 Sportswear.
 *
 * Estratégia: "network first" para as páginas. Os dados vêm sempre da
 * planilha, então NUNCA servimos conteúdo velho quando há internet —
 * o cache só entra em ação se o celular estiver sem conexão.
 */

const CACHE_NAME = "estoque1971-v1";
const ASSETS = [
  "/index.html",
  "/catalogo.html",
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.json",
  "/manifest-catalogo.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Chamadas ao Apps Script (dados da planilha) e imagens do Drive:
  // sempre direto da rede, nunca do cache.
  if (url.hostname.includes("script.google.com") ||
      url.hostname.includes("googleusercontent.com") ||
      url.hostname.includes("unpkg.com") ||
      url.hostname.includes("cdnjs.cloudflare.com") ||
      url.hostname.includes("fonts.googleapis.com") ||
      url.hostname.includes("fonts.gstatic.com")) {
    return;
  }

  // Páginas e ícones do próprio site: rede primeiro, cache como reserva.
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("/index.html")))
  );
});
