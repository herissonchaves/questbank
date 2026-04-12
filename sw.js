// QuestBank Service Worker — Network-First Strategy (v7 - Tags Feature)
// Changed to network-first to ensure fresh files always load
const CACHE_NAME = 'questbank-v14';

const APP_SHELL = [
    './',
    './index.html',
    './app.jsx',
    './db/schema.js',
    './db/taxonomy.js',
    './utils/import-handler.js',
    './utils/export-handler.js',
    './utils/latex-to-docx-math.js',
    './utils/export-engines.js',
    './components/subject-tree.jsx',
    './components/filter-bar.jsx',
    './components/question-card.jsx',
    './components/question-list.jsx',
    './components/selected-panel.jsx',
    './components/import-modal.jsx',
    './components/export-modal.jsx',
    './components/exams-panel.jsx',
    './components/edit-question-modal.jsx',
    './components/rich-text-toolbar.jsx',
    './components/create-question-modal.jsx',
    './components/stats-panel.jsx',
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
    'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
    'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css',
    'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js',
    'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js',
    'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js',
];

// Install — skip waiting so new SW activates immediately
self.addEventListener('install', (event) => {
    console.log('[SW v14] Installing...');
    self.skipWaiting();
});

// Activate — delete ALL old caches and claim clients immediately
self.addEventListener('activate', (event) => {
    console.log('[SW v14] Activating, clearing old caches...');
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.map((key) => {
                console.log('[SW v14] Deleting cache:', key);
                return caches.delete(key);
            }))
        ).then(() => self.clients.claim())
    );
});

// Fetch — Network-first for local files, cache-first for CDN
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // CDN resources: cache-first (they rarely change)
    if (CDN_URLS.some(cdn => event.request.url.startsWith(cdn))) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                if (cached) return cached;
                return fetch(event.request).then((response) => {
                    if (!response || response.status !== 200) return response;
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                });
            })
        );
        return;
    }

    // Local app files: network-first (always get fresh code)
    if (url.origin === self.location.origin) {
        event.respondWith(
            fetch(event.request).then((response) => {
                if (!response || response.status !== 200) return response;
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return response;
            }).catch(() => {
                // Fallback to cache if offline
                return caches.match(event.request).then(cached => {
                    if (cached) return cached;
                    if (event.request.destination === 'document') {
                        return caches.match('./index.html');
                    }
                });
            })
        );
    }
});
