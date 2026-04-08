// QuestBank Service Worker — Cache-First Strategy (v2)
const CACHE_NAME = 'questbank-v2';

const APP_SHELL = [
    './',
    './index.html',
    './app.jsx',
    './db/schema.js',
    './db/taxonomy.js',
    './utils/import-handler.js',
    './utils/export-handler.js',
    './components/subject-tree.jsx',
    './components/filter-bar.jsx',
    './components/question-card.jsx',
    './components/question-list.jsx',
    './components/selected-panel.jsx',
    './components/import-modal.jsx',
    './components/export-modal.jsx',
    './components/exams-panel.jsx',
    './manifest.json',
];

const CDN_URLS = [
    'https://unpkg.com/react@18/umd/react.production.min.js',
    'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
    'https://unpkg.com/@babel/standalone@7/babel.min.js',
    'https://unpkg.com/dexie@3/dist/dexie.js',
    'https://unpkg.com/docx@8.5.0/build/index.umd.js',
    'https://unpkg.com/file-saver@2.0.5/dist/FileSaver.min.js',
    'https://cdn.tailwindcss.com',
];

// Install — cache app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching app shell v2');
            return cache.addAll(APP_SHELL);
        })
    );
    self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// Fetch — cache-first for app shell & CDN, network-first for others
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (url.origin === self.location.origin || CDN_URLS.some(cdn => event.request.url.startsWith(cdn))) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                if (cached) return cached;

                return fetch(event.request).then((response) => {
                    if (!response || response.status !== 200) return response;

                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });

                    return response;
                }).catch(() => {
                    if (event.request.destination === 'document') {
                        return caches.match('./index.html');
                    }
                });
            })
        );
    }
});
