/**
 * Service Worker para PWA
 * Permite funcionamiento offline y instalación como app
 */

const CACHE_NAME = 'inventario-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/config.js',
    '/js/storage.js',
    '/js/sheets.js',
    '/js/scanner.js',
    '/js/ui.js',
    '/js/app.js',
    '/manifest.json',
    'https://unpkg.com/@AaronTsang/quagga2/dist/quagga.min.js'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache abierto');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Error en instalación:', error);
            })
    );
    self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Interceptar peticiones
self.addEventListener('fetch', event => {
    // No cachear peticiones a Google Sheets (necesitamos datos frescos)
    if (event.request.url.includes('docs.google.com')) {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    // Si falla, intentar desde cache
                    return caches.match(event.request);
                })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - devolver respuesta
                if (response) {
                    return response;
                }

                // Clonar la petición
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(response => {
                    // Verificar si la respuesta es válida
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clonar la respuesta
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
            .catch(() => {
                // Fallback para páginas offline
                if (event.request.destination === 'document') {
                    return caches.match('/index.html');
                }
            })
    );
});

// Sincronización en background
self.addEventListener('sync', event => {
    if (event.tag === 'sync-inventory') {
        event.waitUntil(syncInventory());
    }
});

// Función para sincronizar inventario
async function syncInventory() {
    // Aquí se podría implementar sincronización de datos pendientes
    console.log('Sincronizando inventario...');
}

// Notificaciones push
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'Nueva actualización de inventario',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [100, 50, 100]
    };

    event.waitUntil(
        self.registration.showNotification('Sistema de Inventario', options)
    );
});
