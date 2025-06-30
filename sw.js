// sw.js - Service Worker pour ADEME Dashboard

const CACHE_NAME = 'ademe-dashboard-v1.3.0';
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes pour les données ADEME

// Ressources à mettre en cache
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/performance-config.js',
    '/ademeOG.webp',
    '/manifest.json',
    '/favicon.ico',
    '/apple-touch-icon.png'
];

// URLs des données dynamiques ADEME
const DATA_URLS = [
    'https://ia-france-revolution.github.io/Subventions-ADEME/Les%20aides%20financieres%20ADEME.csv'
];

// Messages d'encouragement pour l'attente
const LOADING_MESSAGES = [
    "🔍 Récupération des données sur l'usage de vos impôts...",
    "💰 Analyse des subventions ADEME financées par les contribuables...", 
    "🏛️ Chargement des aides publiques pour la transparence démocratique...",
    "📊 Extraction des données sur l'argent public distribué...",
    "🌱 Décryptage de la répartition des fonds environnementaux..."
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Installation en cours...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Cache ouvert');
                return cache.addAll(STATIC_ASSETS.filter(url => !url.startsWith('http')));
            })
            .then(() => {
                console.log('[SW] Ressources statiques mises en cache');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Erreur lors de la mise en cache:', error);
            })
    );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] Activation en cours...');
    
    event.waitUntil(
        Promise.all([
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => cacheName !== CACHE_NAME)
                        .map(cacheName => {
                            console.log('[SW] Suppression du cache obsolète:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            }),
            self.clients.claim()
        ])
    );
});

// Stratégies de mise en cache améliorées
const CacheStrategies = {
    
    // Cache First - pour les ressources statiques
    cacheFirst: async (request) => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            console.log('[SW] 💾 Récupération depuis le cache:', request.url);
            return cachedResponse;
        }
        
        console.log('[SW] 🌐 Récupération depuis le réseau:', request.url);
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            await cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    },
    
    // Network First avec cache intelligent pour données ADEME
    networkFirstADEME: async (request) => {
        const cache = await caches.open(CACHE_NAME);
        
        try {
            console.log('[SW] 🔄 Tentative réseau pour données ADEME:', request.url);
            
            // Timeout pour éviter l'attente excessive
            const networkResponse = await Promise.race([
                fetch(request),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout réseau')), 8000)
                )
            ]);
            
            if (networkResponse.ok) {
                // Mise à jour du cache avec horodatage
                await cache.put(request, networkResponse.clone());
                await cache.put(
                    `${request.url}_timestamp`, 
                    new Response(Date.now().toString())
                );
                
                console.log('[SW] ✅ Données ADEME mises à jour');
                
                // Notifier les clients de la mise à jour
                self.clients.matchAll().then(clients => {
                    clients.forEach(client => {
                        client.postMessage({
                            type: 'DATA_UPDATED',
                            message: '📊 Nouvelles données ADEME disponibles'
                        });
                    });
                });
            }
            
            return networkResponse;
        } catch (error) {
            console.log('[SW] ❌ Échec réseau, vérification du cache:', request.url);
            const cachedResponse = await cache.match(request);
            
            if (cachedResponse) {
                // Vérifier l'âge du cache
                const timestampResponse = await cache.match(`${request.url}_timestamp`);
                if (timestampResponse) {
                    const timestamp = parseInt(await timestampResponse.text());
                    const age = Date.now() - timestamp;
                    
                    if (age > CACHE_EXPIRY) {
                        console.warn('[SW] ⏰ Cache ADEME expiré (>30min)');
                        
                        // Notification d'expiration
                        self.registration.showNotification('📅 Données potentiellement obsolètes', {
                            body: '⚠️ Les données ADEME affichées datent de plus de 30 minutes. Vérifiez votre connexion pour une mise à jour.',
                            icon: '/favicon.ico',
                            badge: '/favicon.ico',
                            tag: 'ademe-data-staleness',
                            actions: [
                                {
                                    action: 'refresh',
                                    title: '🔄 Actualiser'
                                },
                                {
                                    action: 'dismiss',
                                    title: '❌ Ignorer'
                                }
                            ]
                        });
                    } else {
                        console.log('[SW] ✅ Cache ADEME récent (<30min)');
                    }
                }
                
                return cachedResponse;
            }
            
            // Fallback amélioré pour données ADEME
            return new Response(
                JSON.stringify({
                    error: 'Données ADEME indisponibles',
                    message: '🚫 Impossible de récupérer les données des aides financières ADEME. Vérifiez votre connexion internet.',
                    offline: true,
                    suggestion: '💡 Les données peuvent être temporairement indisponibles en raison de maintenance sur data.gouv.fr',
                    contact: '📧 Contactez contact@aifr.fr si le problème persiste'
                }),
                {
                    status: 503,
                    statusText: 'Service Unavailable - ADEME Data',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-Cache-Status': 'MISS',
                        'X-Data-Source': 'FALLBACK'
                    }
                }
            );
        }
    },
    
    // Stale While Revalidate pour CDN
    staleWhileRevalidate: async (request) => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        });
        
        return cachedResponse || await fetchPromise;
    }
};

// Gestionnaire principal des requêtes
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    if (request.method !== 'GET') return;
    if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') return;
    
    event.respondWith(
        (async () => {
            try {
                // Stratégie spéciale pour les données ADEME
                if (DATA_URLS.some(dataUrl => request.url.includes(dataUrl))) {
                    return await CacheStrategies.networkFirstADEME(request);
                }
                
                // CDN externes
                if (url.hostname.includes('cdnjs.cloudflare.com') || 
                    url.hostname.includes('fonts.googleapis.com') ||
                    url.hostname.includes('cdn.datatables.net')) {
                    return await CacheStrategies.staleWhileRevalidate(request);
                }
                
                // Ressources du même domaine
                if (url.origin === location.origin) {
                    return await CacheStrategies.cacheFirst(request);
                }
                
                return await fetch(request);
                
            } catch (error) {
                console.error('[SW] Erreur lors du traitement de la requête:', error);
                
                if (request.destination === 'document') {
                    return new Response(`
                        <!DOCTYPE html>
                        <html lang="fr">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Hors ligne - ADEME Dashboard</title>
                            <style>
                                body { 
                                    font-family: 'Poppins', sans-serif; 
                                    text-align: center; 
                                    padding: 50px; 
                                    background: linear-gradient(135deg, #0055A4 0%, #EF4135 100%);
                                    color: white;
                                    min-height: 100vh;
                                    display: flex;
                                    flex-direction: column;
                                    justify-content: center;
                                    align-items: center;
                                }
                                .offline-icon { font-size: 4rem; margin-bottom: 2rem; }
                                h1 { margin-bottom: 1rem; }
                                p { margin-bottom: 1.5rem; line-height: 1.6; max-width: 600px; }
                                button { 
                                    background: white; 
                                    color: #0055A4; 
                                    border: none; 
                                    padding: 15px 30px; 
                                    border-radius: 25px; 
                                    font-weight: 600;
                                    cursor: pointer;
                                    font-size: 1rem;
                                    margin: 5px;
                                }
                                button:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
                                .tips { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; margin-top: 20px; }
                            </style>
                        </head>
                        <body>
                            <div class="offline-icon">🏛️</div>
                            <h1>Dashboard ADEME Hors Ligne</h1>
                            <p>🔍 <strong>Impossible d'accéder aux données des aides financières ADEME</strong></p>
                            <p>Le tableau de bord nécessite une connexion internet pour récupérer les dernières données de transparence budgétaire depuis data.gouv.fr</p>
                            
                            <button onclick="location.reload()">🔄 Réessayer</button>
                            <button onclick="history.back()">← Retour</button>
                            
                            <div class="tips">
                                <h3>💡 Suggestions :</h3>
                                <p>• Vérifiez votre connexion internet<br>
                                • data.gouv.fr peut être en maintenance<br>
                                • Réessayez dans quelques minutes</p>
                            </div>
                        </body>
                        </html>
                    `, {
                        headers: { 'Content-Type': 'text/html' }
                    });
                }
                
                return new Response('Ressource indisponible', { status: 503 });
            }
        })()
    );
});

// Gestion des messages depuis l'application principale
self.addEventListener('message', (event) => {
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'CACHE_ADEME_DATA':
                event.waitUntil(
                    caches.open(CACHE_NAME).then(cache => {
                        return cache.add(event.data.url);
                    })
                );
                break;
                
            case 'CLEAR_ADEME_CACHE':
                event.waitUntil(
                    caches.delete(CACHE_NAME).then(() => {
                        return caches.open(CACHE_NAME);
                    })
                );
                break;
                
            case 'GET_CACHE_STATUS':
                event.waitUntil(
                    caches.open(CACHE_NAME).then(cache => {
                        return cache.keys().then(keys => {
                            const ademeDataCached = keys.some(req => 
                                DATA_URLS.some(url => req.url.includes(url))
                            );
                            
                            event.ports[0].postMessage({
                                cached_urls: keys.map(req => req.url),
                                cache_size: keys.length,
                                ademe_data_cached: ademeDataCached
                            });
                        });
                    })
                );
                break;
        }
    }
});

// Gestion des notifications push améliorée
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        
        event.waitUntil(
            self.registration.showNotification(data.title || '🏛️ ADEME Dashboard', {
                body: data.body || '📊 Nouvelles données de transparence disponibles',
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                data: data.url || '/',
                tag: 'ademe-update',
                actions: [
                    {
                        action: 'view',
                        title: '👀 Voir les données'
                    },
                    {
                        action: 'close',
                        title: '❌ Fermer'
                    }
                ]
            })
        );
    }
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'view' || event.action === 'refresh' || !event.action) {
        event.waitUntil(
            clients.openWindow(event.notification.data || '/')
        );
    }
});

console.log('[SW] 🏛️ Service Worker ADEME Dashboard chargé - Prêt pour la transparence démocratique!');
