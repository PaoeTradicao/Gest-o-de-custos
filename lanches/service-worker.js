// Service worker do app de Lanches.
// Fica dentro da pasta lanches/, então só age nas páginas desta pasta: o Gestão não é afetado.
// Estratégia: sempre busca a versão nova na internet (sem cache do navegador); o que está
// guardado só é usado quando o aparelho está sem conexão. Dados do Firebase nunca passam por aqui.
const VERSAO = 'lanches-v2';
const ARQUIVOS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(evento){
  evento.waitUntil(
    caches.open(VERSAO).then(function(cache){ return cache.addAll(ARQUIVOS); }).catch(function(){})
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(evento){
  evento.waitUntil(
    caches.keys().then(function(nomes){
      return Promise.all(nomes.filter(function(n){ return n.indexOf('lanches-') === 0 && n !== VERSAO; })
        .map(function(n){ return caches.delete(n); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(evento){
  const req = evento.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  // Só arquivos do próprio app. Firebase, Google e fontes seguem direto pela internet.
  if(url.origin !== self.location.origin) return;
  // Conferência de versão (index.html?nc=...): vai direto, sem guardar.
  if(url.search) return;
  evento.respondWith(
    fetch(req, { cache:'no-store' }).then(function(resposta){
      if(resposta && resposta.ok){
        const copia = resposta.clone();
        caches.open(VERSAO).then(function(cache){ cache.put(req, copia); });
      }
      return resposta;
    }).catch(function(){
      return caches.match(req).then(function(guardado){
        return guardado || caches.match('./index.html');
      });
    })
  );
});
