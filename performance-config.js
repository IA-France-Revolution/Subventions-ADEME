// performance-config.js - Optimisations ADEME Dashboard (Perfect Table Edition)

(function() {
    'use strict';

    // Configuration des optimisations de performance pour tableau parfait
    const PerformanceConfig = {
        
        // Lazy loading des images et ressources avec priorité table
        initLazyLoading: function() {
            // Observer pour les images
            if ('IntersectionObserver' in window) {
                const imageObserver = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            if (img.dataset.src) {
                                img.src = img.dataset.src;
                                img.classList.remove('lazy');
                                observer.unobserve(img);
                            }
                        }
                    });
                });

                // Observer pour les sections avec priorité table
                const sectionObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('visible');
                            
                            // Optimisation spéciale pour le conteneur de table
                            if (entry.target.id === 'data-explorer') {
                                this.optimizeTableRendering();
                            }
                        }
                    });
                }, { threshold: 0.1 });

                // Appliquer aux images lazy
                document.querySelectorAll('img[data-src]').forEach(img => {
                    imageObserver.observe(img);
                });

                // Appliquer aux sections pour animations avec priorité table
                document.querySelectorAll('.chart-container, .stat-card, .table-container').forEach(section => {
                    sectionObserver.observe(section);
                });
            }
        },

        // Préchargement des ressources critiques avec focus table
        preloadCriticalResources: function() {
            const criticalResources = [
                { href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap', as: 'style' },
                { href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css', as: 'style' },
                { href: 'https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap4.min.css', as: 'style' },
                { href: 'https://cdn.datatables.net/buttons/2.4.1/css/buttons.bootstrap4.min.css', as: 'style' }
            ];

            // Ajouter l'URL des données ADEME si disponible
            if (typeof appState !== 'undefined' && appState.dataUrl) {
                criticalResources.push({ 
                    href: appState.dataUrl, 
                    as: 'fetch', 
                    crossorigin: 'anonymous',
                    priority: 'high'
                });
            }

            criticalResources.forEach(resource => {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.href = resource.href;
                link.as = resource.as;
                if (resource.crossorigin) link.crossOrigin = resource.crossorigin;
                if (resource.priority) link.fetchPriority = resource.priority;
                document.head.appendChild(link);
            });
            
            console.log('🚀 Ressources critiques préchargées pour table parfaite');
        },

        // Optimisation des WebFonts avec cache intelligent
        optimizeFonts: function() {
            // Préchargement des polices critiques pour lisibilité parfaite
            const fontLinks = [
                'https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecnFHGPc.woff2', // Regular
                'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLGT9Z1xlFd2JQEk.woff2', // Bold
                'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLDD7Z1xlFd2JQEk.woff2', // Medium
                'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLEj6Z1xlFd2JQEk.woff2'  // SemiBold
            ];

            fontLinks.forEach(href => {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.href = href;
                link.as = 'font';
                link.type = 'font/woff2';
                link.crossOrigin = 'anonymous';
                document.head.appendChild(link);
            });

            // Détection de chargement des polices avec optimisation table
            if ('FontFace' in window) {
                const fontPromises = [
                    new FontFace('Poppins', 'url(https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecnFHGPc.woff2)').load(),
                    new FontFace('Poppins', 'url(https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLGT9Z1xlFd2JQEk.woff2)', { weight: '700' }).load(),
                    new FontFace('Poppins', 'url(https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLDD7Z1xlFd2JQEk.woff2)', { weight: '500' }).load(),
                    new FontFace('Poppins', 'url(https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLEj6Z1xlFd2JQEk.woff2)', { weight: '600' }).load()
                ];

                Promise.all(fontPromises).then(fonts => {
                    fonts.forEach(font => document.fonts.add(font));
                    document.body.classList.add('fonts-loaded');
                    
                    // Trigger table re-render for perfect text display
                    this.notifyTableFontsReady();
                    
                    console.log('✅ Polices optimisées pour lisibilité parfaite');
                }).catch(error => {
                    console.warn('❌ Erreur de chargement des polices:', error);
                });
            }
        },

        // Notification de polices prêtes pour le tableau
        notifyTableFontsReady: function() {
            const tableContainer = document.querySelector('#contractsTable');
            if (tableContainer && window.appState && window.appState.dataTable) {
                // Force table redraw for perfect font rendering
                setTimeout(() => {
                    if (window.appState.dataTable.draw) {
                        window.appState.dataTable.draw(false);
                    }
                }, 100);
            }
        },

        // Débounce avancé avec optimisations spéciales table
        createAdvancedDebounce: function(func, wait, options = {}) {
            let timeout;
            let previous = 0;
            const { leading = false, maxWait = null, trailing = true, tableOptimized = false } = options;

            return function executedFunction(...args) {
                const now = Date.now();
                
                if (!previous && !leading) previous = now;
                
                const remaining = wait - (now - previous);
                
                if (remaining <= 0 || remaining > wait || (maxWait && (now - previous) >= maxWait)) {
                    if (timeout) {
                        clearTimeout(timeout);
                        timeout = null;
                    }
                    previous = now;
                    
                    // Optimisation spéciale pour les interactions table
                    if (tableOptimized) {
                        requestAnimationFrame(() => {
                            func.apply(this, args);
                        });
                    } else {
                        func.apply(this, args);
                    }
                } else if (!timeout && trailing) {
                    timeout = setTimeout(() => {
                        previous = !leading ? 0 : Date.now();
                        timeout = null;
                        
                        if (tableOptimized) {
                            requestAnimationFrame(() => {
                                func.apply(this, args);
                            });
                        } else {
                            func.apply(this, args);
                        }
                    }, remaining);
                }
            };
        },

        // Optimisation avancée du rendu des tableaux
        optimizeTableRendering: function() {
            console.log('🎯 Optimisation du rendu table en cours...');
            
            // Virtual scrolling intelligent pour grands datasets
            const VirtualScrolling = {
                init: function(table, data, options = {}) {
                    const { 
                        rowHeight = 65, // Hauteur augmentée pour objet complet
                        visibleRows = 25, 
                        bufferRows = 5,
                        enableSmartRender = true 
                    } = options;
                    
                    if (data.length <= 500) {
                        console.log('📊 Dataset petit, virtual scrolling désactivé');
                        return; // Pas nécessaire pour petits datasets
                    }
                    
                    console.log(`🔄 Virtual scrolling activé pour ${data.length} lignes`);
                    
                    const container = table.closest('.table-responsive');
                    if (!container) return;

                    let isScrolling = false;
                    const scrollHandler = PerformanceConfig.createAdvancedDebounce(() => {
                        if (!isScrolling) {
                            isScrolling = true;
                            
                            const scrollTop = container.scrollTop;
                            const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - bufferRows);
                            const endIndex = Math.min(startIndex + visibleRows + (bufferRows * 2), data.length);
                            
                            if (enableSmartRender) {
                                VirtualScrolling.smartRenderVisibleRows(table, data, startIndex, endIndex);
                            }
                            
                            requestAnimationFrame(() => {
                                isScrolling = false;
                            });
                        }
                    }, 16, { tableOptimized: true }); // 60fps optimisé table
                    
                    container.addEventListener('scroll', scrollHandler, { passive: true });
                    
                    return {
                        destroy: () => container.removeEventListener('scroll', scrollHandler),
                        refresh: () => scrollHandler()
                    };
                },

                smartRenderVisibleRows: function(table, data, startIndex, endIndex) {
                    // Rendu intelligent avec cache des éléments DOM
                    const visibleRows = endIndex - startIndex;
                    console.log(`🎨 Rendu intelligent lignes ${startIndex} à ${endIndex} (${visibleRows} visibles)`);
                    
                    // Cache DOM pour performance
                    if (!this._domCache) {
                        this._domCache = new Map();
                    }
                    
                    // Optimisation de rendu par batch
                    const fragment = document.createDocumentFragment();
                    
                    for (let i = startIndex; i < endIndex; i++) {
                        const rowData = data[i];
                        if (rowData) {
                            let rowElement = this._domCache.get(i);
                            if (!rowElement) {
                                rowElement = this.createOptimizedRow(rowData, i);
                                this._domCache.set(i, rowElement);
                            }
                            fragment.appendChild(rowElement);
                        }
                    }
                    
                    // Batch DOM update
                    requestAnimationFrame(() => {
                        if (table.querySelector('tbody')) {
                            table.querySelector('tbody').appendChild(fragment);
                        }
                    });
                },

                createOptimizedRow: function(rowData, index) {
                    // Création optimisée de ligne avec focus lisibilité
                    const row = document.createElement('tr');
                    row.className = 'table-row-enhanced virtual-row';
                    row.setAttribute('data-row-index', index);
                    
                    // Cellules optimisées pour lecture parfaite
                    const cells = [
                        this.createDetailCell(rowData),
                        this.createObjectCell(rowData), // Priorité objet
                        this.createBeneficiaireCell(rowData),
                        this.createMontantCell(rowData),
                        this.createDateCell(rowData),
                        this.createDispositifCell(rowData),
                        this.createTypeCell(rowData)
                    ];
                    
                    cells.forEach(cell => row.appendChild(cell));
                    
                    return row;
                },

                createObjectCell: function(data) {
                    const cell = document.createElement('td');
                    cell.className = 'objet-cell';
                    
                    const objectDiv = document.createElement('div');
                    objectDiv.className = 'object-text optimized';
                    objectDiv.textContent = data.objet || '';
                    objectDiv.title = data.objet || '';
                    
                    cell.appendChild(objectDiv);
                    return cell;
                },

                createDetailCell: function(data) {
                    const cell = document.createElement('td');
                    cell.className = 'details-control';
                    
                    const button = document.createElement('button');
                    button.className = 'show-details-btn';
                    button.innerHTML = '<i class="fas fa-plus-circle"></i>';
                    button.setAttribute('aria-label', 'Afficher les détails');
                    
                    cell.appendChild(button);
                    return cell;
                },

                createBeneficiaireCell: function(data) {
                    const cell = document.createElement('td');
                    cell.className = 'beneficiaire-cell';
                    cell.textContent = data.nomBeneficiaire || '';
                    return cell;
                },

                createMontantCell: function(data) {
                    const cell = document.createElement('td');
                    cell.className = 'montant-cell';
                    cell.textContent = new Intl.NumberFormat('fr-FR', { 
                        style: 'currency', 
                        currency: 'EUR',
                        minimumFractionDigits: 0 
                    }).format(data.montant || 0);
                    return cell;
                },

                createDateCell: function(data) {
                    const cell = document.createElement('td');
                    cell.className = 'date-cell';
                    
                    if (data.dateNotification && data.dateNotification !== 'N/A') {
                        try {
                            const date = new Date(data.dateNotification);
                            cell.textContent = date.toLocaleDateString('fr-FR', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                            });
                        } catch {
                            cell.textContent = data.dateNotification;
                        }
                    } else {
                        cell.textContent = 'N/A';
                    }
                    
                    return cell;
                },

                createDispositifCell: function(data) {
                    const cell = document.createElement('td');
                    cell.className = 'dispositif-cell';
                    
                    const text = data.dispositifAide || '';
                    if (text.length > 30) {
                        cell.innerHTML = `<span title="${text.replace(/"/g, '&quot;')}" class="smart-truncated">${text.substring(0, 27)}...</span>`;
                    } else {
                        cell.textContent = text;
                    }
                    
                    return cell;
                },

                createTypeCell: function(data) {
                    const cell = document.createElement('td');
                    cell.className = 'type-cell';
                    
                    const text = data.conditionsVersement || '';
                    if (text.length > 15) {
                        cell.innerHTML = `<span title="${text.replace(/"/g, '&quot;')}">${text.substring(0, 12)}...</span>`;
                    } else {
                        cell.textContent = text;
                    }
                    
                    return cell;
                }
            };

            return VirtualScrolling;
        },

        // Optimisation des interactions table
        enhanceTableInteractions: function() {
            // Optimisation des événements de survol
            const hoverHandler = this.createAdvancedDebounce((e) => {
                const row = e.target.closest('tr');
                if (row && !row.classList.contains('hover-optimized')) {
                    row.classList.add('hover-optimized');
                    
                    // Préchargement intelligent des détails
                    this.preloadRowDetails(row);
                }
            }, 100, { tableOptimized: true });

            // Optimisation des clics
            const clickHandler = this.createAdvancedDebounce((e) => {
                const target = e.target;
                
                // Gestion optimisée des textes tronqués
                if (target.classList.contains('smart-truncated')) {
                    this.showSmartTooltip(target);
                }
                
                // Gestion optimisée des objets
                if (target.classList.contains('object-text')) {
                    this.handleObjectInteraction(target);
                }
            }, 50, { tableOptimized: true });

            // Application des gestionnaires optimisés
            document.addEventListener('mouseover', hoverHandler, { passive: true });
            document.addEventListener('click', clickHandler, { passive: true });
            
            console.log('🎯 Interactions table optimisées');
        },

        // Préchargement intelligent des détails de ligne
        preloadRowDetails: function(row) {
            if (!row.dataset.detailsPreloaded && window.appState && window.appState.dataTable) {
                const rowData = window.appState.dataTable.row(row).data();
                if (rowData) {
                    // Préchargement en arrière-plan
                    if ('requestIdleCallback' in window) {
                        requestIdleCallback(() => {
                            this.prepareRowDetails(rowData);
                            row.dataset.detailsPreloaded = 'true';
                        });
                    }
                }
            }
        },

        // Préparation des détails de ligne
        prepareRowDetails: function(rowData) {
            // Préparer le HTML des détails pour affichage rapide
            if (!this._detailsCache) {
                this._detailsCache = new Map();
            }
            
            const detailHtml = this.generateDetailHtml(rowData);
            this._detailsCache.set(rowData._id, detailHtml);
        },

        // Génération optimisée du HTML des détails
        generateDetailHtml: function(data) {
            return `
                <div class="detail-content-wrapper" style="display:none;">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <strong>Référence Décision/ID:</strong> 
                            <div>${this.escapeHtml(data._id)}</div>
                        </div>
                        <div class="detail-item">
                            <strong>ID Bénéficiaire:</strong> 
                            <div>${this.escapeHtml(data._idBeneficiaire)}</div>
                        </div>
                        <div class="detail-item full-width">
                            <strong>Objet Complet:</strong> 
                            <div class="object-detail">${this.escapeHtml(data._objetComplet)}</div>
                        </div>
                        <div class="detail-item">
                            <strong>Bénéficiaire (complet):</strong> 
                            <div>${this.escapeHtml(data._nomBeneficiaireComplet)}</div>
                        </div>
                        <div class="detail-item">
                            <strong>Dispositif d'Aide (complet):</strong> 
                            <div>${this.escapeHtml(data._dispositifAideComplet)}</div>
                        </div>
                        <div class="detail-item">
                            <strong>Nature de l'Aide:</strong> 
                            <div>${this.escapeHtml(data._natureAide)}</div>
                        </div>
                        <div class="detail-item">
                            <strong>Conditions Versement:</strong> 
                            <div>${this.escapeHtml(data._conditionsVersement)}</div>
                        </div>
                        <div class="detail-item">
                            <strong>Dates Période Versement:</strong> 
                            <div>${this.escapeHtml(data._datesPeriodeVersement)}</div>
                        </div>
                        <div class="detail-item">
                            <strong>Notification UE:</strong> 
                            <div>${this.escapeHtml(data._notificationUE)}</div>
                        </div>
                        <div class="detail-item">
                            <strong>Date Convention (brute):</strong> 
                            <div>${this.escapeHtml(data._dateNotificationRaw)}</div>
                        </div>
                    </div>
                </div>
            `;
        },

        // Échappement HTML sécurisé
        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        },

        // Gestion des interactions avec les objets
        handleObjectInteraction: function(element) {
            // Animation douce pour l'expansion/réduction
            element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            
            if (element.classList.contains('expanded')) {
                element.classList.remove('expanded');
                element.style.maxHeight = '50px';
            } else {
                // Fermer les autres objets étendus
                document.querySelectorAll('.object-text.expanded').forEach(el => {
                    el.classList.remove('expanded');
                    el.style.maxHeight = '50px';
                });
                
                element.classList.add('expanded');
                element.style.maxHeight = element.scrollHeight + 'px';
            }
        },

        // Tooltip intelligent pour textes tronqués
        showSmartTooltip: function(element) {
            const fullText = element.getAttribute('title');
            if (fullText && window.showNotification) {
                window.showNotification(`📋 ${fullText}`, 'info');
            }
        }
    };

    // Gestionnaire de mémoire avancé avec focus table
    const MemoryManager = {
        
        // Nettoyage automatique optimisé
        cleanupCharts: function() {
            if (typeof appState !== 'undefined' && appState.charts) {
                Object.keys(appState.charts).forEach(chartId => {
                    const canvas = document.getElementById(chartId);
                    if (!canvas || !canvas.isConnected) {
                        if (appState.charts[chartId]) {
                            appState.charts[chartId].destroy();
                            delete appState.charts[chartId];
                        }
                    }
                });
            }
        },

        // Nettoyage spécialisé table
        cleanupTableCache: function() {
            // Nettoyer les caches spécifiques au tableau
            if (PerformanceConfig._detailsCache) {
                PerformanceConfig._detailsCache.clear();
            }
            
            // Nettoyer le cache DOM virtual scrolling
            const virtualScrolling = PerformanceConfig.optimizeTableRendering();
            if (virtualScrolling && virtualScrolling._domCache) {
                virtualScrolling._domCache.clear();
            }
            
            console.log('🧹 Cache table nettoyé');
        },

        // Monitoring avancé avec métriques table
        monitorMemoryUsage: function() {
            if ('memory' in performance) {
                const memory = performance.memory;
                const memoryInfo = {
                    used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
                    total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
                    limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
                };

                // Métriques spécifiques table
                const tableMetrics = this.getTableMemoryMetrics();
                
                // Warning si utilisation > 75% (plus strict pour performance table)
                if (memoryInfo.used / memoryInfo.limit > 0.75) {
                    console.warn('⚠️ Utilisation mémoire élevée (table):', { ...memoryInfo, table: tableMetrics });
                    this.performTableOptimizedCleanup();
                }

                return { ...memoryInfo, table: tableMetrics };
            }
            return null;
        },

        // Métriques mémoire spécifiques table
        getTableMemoryMetrics: function() {
            const tableContainer = document.querySelector('#contractsTable');
            const metrics = {
                rowsInDom: 0,
                cachedDetails: 0,
                virtualRows: 0
            };
            
            if (tableContainer) {
                metrics.rowsInDom = tableContainer.querySelectorAll('tbody tr').length;
                metrics.virtualRows = tableContainer.querySelectorAll('.virtual-row').length;
            }
            
            if (PerformanceConfig._detailsCache) {
                metrics.cachedDetails = PerformanceConfig._detailsCache.size;
            }
            
            return metrics;
        },

        // Nettoyage optimisé pour table
        performTableOptimizedCleanup: function() {
            this.cleanupCharts();
            this.cleanupTableCache();
            
            // Nettoyage spécifique DataTables
            if (window.appState && window.appState.dataTable) {
                window.appState.dataTable.clear().draw();
                
                // Forcer garbage collection si disponible
                if (window.gc) {
                    window.gc();
                }
            }
            
            // Nettoyer les event listeners orphelins avec namespace table
            if (typeof $ !== 'undefined') {
                $(document).off('.table-namespace');
            }
            
            console.log('🧹 Nettoyage mémoire optimisé table effectué');
        }
    };

    // Optimiseur réseau spécialisé ADEME
    const NetworkOptimizer = {
        
        // Cache intelligent avec TTL optimisé pour données ADEME
        cache: new Map(),
        
        cachedFetch: function(url, options = {}, ttl = 15 * 60 * 1000) { // 15 minutes pour ADEME
            const cacheKey = url + JSON.stringify(options);
            const cached = this.cache.get(cacheKey);
            
            if (cached && (Date.now() - cached.timestamp) < ttl) {
                console.log('📦 Cache hit pour données ADEME');
                return Promise.resolve(cached.data.clone());
            }
            
            console.log('🌐 Fetch réseau pour données ADEME');
            return fetch(url, options)
                .then(response => {
                    if (response.ok) {
                        const cloned = response.clone();
                        this.cache.set(cacheKey, {
                            data: cloned,
                            timestamp: Date.now()
                        });
                        
                        // Notification cache update
                        if (typeof showNotification === 'function') {
                            showNotification('📊 Données ADEME mises à jour', 'success');
                        }
                    }
                    return response;
                })
                .catch(error => {
                    console.error('❌ Erreur fetch ADEME:', error);
                    throw error;
                });
        },

        // Retry avec backoff exponentiel optimisé ADEME
        fetchWithRetry: function(url, options = {}, maxRetries = 3) {
            const attemptFetch = (attempt) => {
                return fetch(url, options)
                    .catch(error => {
                        if (attempt < maxRetries) {
                            const delay = Math.min(Math.pow(2, attempt) * 1000, 10000); // Max 10s
                            console.log(`🔄 Retry ADEME ${attempt + 1}/${maxRetries} dans ${delay}ms`);
                            
                            return new Promise(resolve => {
                                setTimeout(() => {
                                    resolve(attemptFetch(attempt + 1));
                                }, delay);
                            });
                        }
                        throw error;
                    });
            };
            
            return attemptFetch(0);
        },

        // Préchargement prédictif avancé pour ADEME
        predictivePreload: function() {
            try {
                const userPatterns = JSON.parse(localStorage.getItem('ademe_user_patterns') || '{}');
                
                // Analyser les patterns d'usage table
                const tablePatterns = userPatterns.tableInteractions || {};
                
                // Précharger les filtres populaires
                if (userPatterns.mostUsedFilters) {
                    userPatterns.mostUsedFilters.forEach(filter => {
                        if (filter.count > 3) { // Seuil réduit pour réactivité
                            this.preloadFilteredData(filter);
                        }
                    });
                }
                
                // Précharger les détails souvent consultés
                if (tablePatterns.mostViewedDetails) {
                    tablePatterns.mostViewedDetails.forEach(detail => {
                        if (detail.count > 2) {
                            this.preloadDetailData(detail);
                        }
                    });
                }
                
                console.log('🎯 Préchargement prédictif ADEME activé');
            } catch (error) {
                console.warn('⚠️ Erreur préchargement prédictif:', error);
            }
        },

        // Préchargement des données filtrées
        preloadFilteredData: function(filter) {
            if (typeof appState !== 'undefined' && appState.rawData) {
                const filteredData = appState.rawData.filter(item => {
                    return filter.type === 'year' ? item.annee == filter.value :
                           filter.type === 'dispositif' ? item.dispositifAide === filter.value :
                           filter.type === 'search' ? 
                           (item.objet.toLowerCase().includes(filter.value.toLowerCase()) ||
                            item.nomBeneficiaire.toLowerCase().includes(filter.value.toLowerCase())) :
                           true;
                });
                
                if (filteredData.length > 0) {
                    if ('requestIdleCallback' in window) {
                        requestIdleCallback(() => {
                            this.precalculateTableStats(filteredData);
                        }, { timeout: 2000 });
                    }
                }
            }
        },

        // Préchargement des détails
        preloadDetailData: function(detail) {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => {
                    // Préparer les détails en arrière-plan
                    if (PerformanceConfig.prepareRowDetails) {
                        PerformanceConfig.prepareRowDetails(detail.data);
                    }
                });
            }
        },

        // Précalcul optimisé des stats table
        precalculateTableStats: function(data) {
            const stats = {
                total: data.length,
                sum: data.reduce((sum, item) => sum + (item.montant || 0), 0),
                avg: data.length > 0 ? data.reduce((sum, item) => sum + (item.montant || 0), 0) / data.length : 0,
                median: this.calculateMedian(data.map(d => d.montant || 0)),
                uniqueBeneficiaires: new Set(data.map(d => d.idBeneficiaire)).size,
                yearRange: this.getYearRange(data)
            };
            
            // Cache optimisé pour stats
            try {
                const cacheKey = `table_stats_${data.length}_${Date.now()}`;
                sessionStorage.setItem(cacheKey, JSON.stringify(stats));
                
                // Nettoyer les anciens caches de stats
                this.cleanupOldStatsCache();
            } catch (error) {
                console.warn('⚠️ Erreur cache stats table:', error);
            }
        },

        // Calcul médiane optimisé
        calculateMedian: function(numbers) {
            const sorted = numbers.filter(n => typeof n === 'number' && !isNaN(n)).sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 === 0 ? 
                (sorted[mid - 1] + sorted[mid]) / 2 : 
                sorted[mid];
        },

        // Calcul range années
        getYearRange: function(data) {
            const years = data.map(d => d.annee).filter(y => y && !isNaN(y));
            return years.length > 0 ? {
                min: Math.min(...years),
                max: Math.max(...years),
                count: new Set(years).size
            } : null;
        },

        // Nettoyage cache stats ancien
        cleanupOldStatsCache: function() {
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && key.startsWith('table_stats_')) {
                    const timestamp = parseInt(key.split('_')[3]);
                    if (Date.now() - timestamp > 30 * 60 * 1000) { // 30 min
                        sessionStorage.removeItem(key);
                    }
                }
            }
        }
    };

    // Optimiseur d'accessibilité pour table parfaite
    const AccessibilityOptimizer = {
        
        // Navigation clavier améliorée pour table
        enhanceKeyboardNavigation: function() {
            // Gestion du focus visible optimisée
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    document.body.classList.add('keyboard-navigation');
                }
                
                // Navigation table avec flèches
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                    this.handleTableKeyboardNavigation(e);
                }
                
                // Raccourcis table
                if (e.ctrlKey || e.metaKey) {
                    switch(e.key) {
                        case 'f':
                            e.preventDefault();
                            document.getElementById('globalSearch')?.focus();
                            break;
                        case 'e':
                            e.preventDefault();
                            document.getElementById('expandAllRows')?.click();
                            break;
                        case 'r':
                            e.preventDefault();
                            document.getElementById('resetFiltersButton')?.click();
                            break;
                    }
                }
            });

            document.addEventListener('mousedown', () => {
                document.body.classList.remove('keyboard-navigation');
            });

            // Skip links améliorés
            this.createEnhancedSkipLinks();
            
            console.log('⌨️ Navigation clavier table optimisée');
        },

        // Navigation clavier dans le tableau
        handleTableKeyboardNavigation: function(e) {
            const activeElement = document.activeElement;
            const tableContainer = document.querySelector('#contractsTable');
            
            if (!tableContainer || !tableContainer.contains(activeElement)) return;
            
            const currentRow = activeElement.closest('tr');
            if (!currentRow) return;
            
            e.preventDefault();
            
            switch(e.key) {
                case 'ArrowUp':
                    this.navigateToRow(currentRow, 'previous');
                    break;
                case 'ArrowDown':
                    this.navigateToRow(currentRow, 'next');
                    break;
                case 'ArrowLeft':
                    this.navigateToCell(activeElement, 'previous');
                    break;
                case 'ArrowRight':
                    this.navigateToCell(activeElement, 'next');
                    break;
            }
        },

        // Navigation entre lignes
        navigateToRow: function(currentRow, direction) {
            const targetRow = direction === 'next' ? 
                currentRow.nextElementSibling : 
                currentRow.previousElementSibling;
            
            if (targetRow) {
                const focusableElement = targetRow.querySelector('button, a, [tabindex]') || 
                                       targetRow.querySelector('td:first-child');
                if (focusableElement) {
                    focusableElement.focus();
                }
            }
        },

        // Navigation entre cellules
        navigateToCell: function(currentCell, direction) {
            const currentTd = currentCell.closest('td');
            if (!currentTd) return;
            
            const targetTd = direction === 'next' ? 
                currentTd.nextElementSibling : 
                currentTd.previousElementSibling;
            
            if (targetTd) {
                const focusableElement = targetTd.querySelector('button, a, [tabindex]') || targetTd;
                if (focusableElement) {
                    focusableElement.focus();
                }
            }
        },

        // Skip links améliorés
        createEnhancedSkipLinks: function() {
            const skipLinksContainer = document.createElement('div');
            skipLinksContainer.className = 'skip-links-container';
            
            const skipLinks = [
                { href: '#data-explorer', text: 'Aller au tableau des données' },
                { href: '#filters-section', text: 'Aller aux filtres' },
                { href: '#charts-section', text: 'Aller aux graphiques' },
                { href: '#stats-summary', text: 'Aller aux statistiques' }
            ];
            
            skipLinks.forEach(link => {
                const skipLink = document.createElement('a');
                skipLink.href = link.href;
                skipLink.textContent = link.text;
                skipLink.className = 'skip-link enhanced';
                skipLinksContainer.appendChild(skipLink);
            });
            
            document.body.insertBefore(skipLinksContainer, document.body.firstChild);
        },

        // Annonces optimisées pour table
        announceToScreenReader: function(message, priority = 'polite', context = 'general') {
            const announcement = document.createElement('div');
            announcement.setAttribute('aria-live', priority);
            announcement.setAttribute('aria-atomic', 'true');
            announcement.className = `sr-only announcement-${context}`;
            announcement.textContent = message;
            
            // Contexte spécialisé pour table
            if (context === 'table') {
                announcement.setAttribute('role', 'status');
            }
            
            document.body.appendChild(announcement);
            
            setTimeout(() => {
                if (document.body.contains(announcement)) {
                    document.body.removeChild(announcement);
                }
            }, priority === 'assertive' ? 2000 : 1000);
        },

        // Amélioration contraste pour table
        enhanceTableContrast: function() {
            // Détecter les préférences système
            if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
                document.body.classList.add('high-contrast-table');
            }
            
            // Écouter les changements
            if (window.matchMedia) {
                const contrastMediaQuery = window.matchMedia('(prefers-contrast: high)');
                const handleContrastChange = (e) => {
                    document.body.classList.toggle('high-contrast-table', e.matches);
                };
                
                if (contrastMediaQuery.addEventListener) {
                    contrastMediaQuery.addEventListener('change', handleContrastChange);
                } else {
                    contrastMediaQuery.addListener(handleContrastChange);
                }
            }
        }
    };

    // Initialisateur automatique amélioré
    const AutoInitializer = {
        
        init: function() {
            // Attendre que le DOM soit prêt
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.runOptimizations());
            } else {
                this.runOptimizations();
            }
        },

        runOptimizations: function() {
            try {
                console.log('🚀 Initialisation optimisations ADEME Table Parfaite...');
                
                // Performance avec priorité table
                PerformanceConfig.preloadCriticalResources();
                PerformanceConfig.optimizeFonts();
                PerformanceConfig.initLazyLoading();
                
                // Accessibilité optimisée table
                AccessibilityOptimizer.enhanceKeyboardNavigation();
                AccessibilityOptimizer.enhanceTableContrast();
                
                // Réseau optimisé ADEME
                NetworkOptimizer.predictivePreload();
                
                // Interactions table
                PerformanceConfig.enhanceTableInteractions();
                
                // Monitoring avancé
                setInterval(() => {
                    MemoryManager.monitorMemoryUsage();
                }, 30000); // Toutes les 30 secondes
                
                // Monitoring spécialisé table
                setInterval(() => {
                    this.monitorTablePerformance();
                }, 10000); // Toutes les 10 secondes
                
                // Nettoyage au déchargement
                window.addEventListener('beforeunload', () => {
                    MemoryManager.performTableOptimizedCleanup();
                });
                
                // Analytics de performance table
                this.initTablePerformanceAnalytics();
                
                console.log('✅ Optimisations ADEME Table Parfaite activées');
            } catch (error) {
                console.error('❌ Erreur lors de l\'initialisation des optimisations:', error);
            }
        },

        // Monitoring performance table
        monitorTablePerformance: function() {
            const tableContainer = document.querySelector('#contractsTable');
            if (!tableContainer) return;
            
            const tableMetrics = {
                rowCount: tableContainer.querySelectorAll('tbody tr').length,
                scrollHeight: tableContainer.scrollHeight,
                visibleRows: this.countVisibleRows(tableContainer),
                renderTime: this.measureRenderTime(tableContainer)
            };
            
            // Warning si performance dégradée
            if (tableMetrics.renderTime > 16) { // 60fps threshold
                console.warn('⚠️ Performance table dégradée:', tableMetrics);
                this.optimizeTablePerformance();
            }
        },

        // Compter lignes visibles
        countVisibleRows: function(table) {
            const container = table.closest('.table-responsive');
            if (!container) return 0;
            
            const containerRect = container.getBoundingClientRect();
            const rows = table.querySelectorAll('tbody tr');
            let visibleCount = 0;
            
            rows.forEach(row => {
                const rowRect = row.getBoundingClientRect();
                if (rowRect.bottom > containerRect.top && rowRect.top < containerRect.bottom) {
                    visibleCount++;
                }
            });
            
            return visibleCount;
        },

        // Mesurer temps de rendu
        measureRenderTime: function(table) {
            if (!table._lastRenderStart) return 0;
            return performance.now() - table._lastRenderStart;
        },

        // Optimiser performance table
        optimizeTablePerformance: function() {
            if (window.appState && window.appState.dataTable) {
                // Réduire temporairement la fréquence de mise à jour
                const table = window.appState.dataTable;
                if (table.settings()[0]) {
                    table.settings()[0]._iDisplayLength = Math.min(
                        table.settings()[0]._iDisplayLength, 15
                    );
                    table.draw();
                }
                
                console.log('🎯 Performance table optimisée automatiquement');
            }
        },

        // Analytics de performance
        initTablePerformanceAnalytics: function() {
            // Mesurer les métriques clés
            const metrics = {
                initialLoadTime: 0,
                firstTableRender: 0,
                firstInteraction: 0,
                totalRows: 0,
                cacheHitRate: 0
            };
            
            // Observer les performances
            if ('PerformanceObserver' in window) {
                const observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach(entry => {
                        if (entry.name.includes('table') || entry.name.includes('ademe')) {
                            console.log('📊 Métrique table:', entry);
                        }
                    });
                });
                
                observer.observe({ entryTypes: ['measure', 'navigation'] });
            }
            
            // Mesurer le temps de première interaction
            document.addEventListener('click', function firstClick() {
                metrics.firstInteraction = performance.now();
                document.removeEventListener('click', firstClick);
                console.log('⚡ Première interaction:', metrics.firstInteraction + 'ms');
            }, { once: true });
        }
    };

    // CSS pour les optimisations table parfaite
    const optimizationStyles = `
        <style>
        /* Optimisations table parfaite */
        .table-row-enhanced {
            contain: layout style paint;
            will-change: transform;
        }
        
        .table-row-enhanced:hover {
            contain: none;
        }
        
        .object-text.optimized {
            font-feature-settings: "liga" 1, "kern" 1;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        .virtual-row {
            transform: translateZ(0);
            backface-visibility: hidden;
        }
        
        /* Navigation clavier améliorée */
        .keyboard-navigation *:focus {
            outline: 3px solid var(--primary-color) !important;
            outline-offset: 2px !important;
            box-shadow: 0 0 0 6px rgba(0, 85, 164, 0.2) !important;
        }
        
        .skip-links-container {
            position: absolute;
            top: -200px;
            left: 0;
            z-index: 10001;
        }
        
        .skip-link.enhanced {
            position: absolute;
            left: -10000px;
            top: auto;
            width: 1px;
            height: 1px;
            overflow: hidden;
            background: var(--primary-color);
            color: white;
            padding: 12px 20px;
            text-decoration: none;
            border-radius: 0 0 8px 0;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        .skip-link.enhanced:focus {
            position: fixed;
            left: 10px;
            top: 10px;
            width: auto;
            height: auto;
            z-index: 10002;
        }
        
        /* Mode haut contraste table */
        .high-contrast-table .table-row-enhanced {
            border: 2px solid var(--primary-color) !important;
        }
        
        .high-contrast-table .object-text {
            background: rgba(0, 85, 164, 0.05) !important;
            border: 1px solid var(--primary-color) !important;
        }
        
        .high-contrast-table .montant-cell {
            background: rgba(239, 65, 53, 0.05) !important;
            font-weight: 800 !important;
        }
        
        /* Optimisations polices */
        .fonts-loaded .object-text {
            font-family: 'Poppins', 'Segoe UI', system-ui, sans-serif;
            font-display: swap;
        }
        
        /* Performance optimizations */
        .table-container {
            contain: layout style paint;
            transform: translateZ(0);
        }
        
        .chart-wrapper {
            contain: layout style paint;
        }
        
        /* Animations optimisées */
        @keyframes tableRowFadeIn {
            from { 
                opacity: 0; 
                transform: translateY(10px); 
            }
            to { 
                opacity: 1; 
                transform: translateY(0); 
            }
        }
        
        .table-row-enhanced {
            animation: tableRowFadeIn 0.3s ease-out;
        }
        
        /* Optimisation mobile table */
        @media (max-width: 768px) {
            .table-row-enhanced {
                contain: none;
                will-change: auto;
            }
            
            .object-text {
                line-height: 1.5 !important;
                padding: 8px !important;
            }
            
            .virtual-row {
                transform: none;
            }
        }
        
        /* Indicateur performance */
        .performance-indicator {
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: rgba(46, 204, 113, 0.9);
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.7rem;
            z-index: 1001;
            display: none;
        }
        
        .performance-indicator.visible {
            display: block;
        }
        
        .performance-indicator.warning {
            background: rgba(241, 196, 15, 0.9);
            color: #333;
        }
        
        .performance-indicator.error {
            background: rgba(231, 76, 60, 0.9);
        }
        </style>
    `;

    // Injecter les styles optimisés
    document.head.insertAdjacentHTML('beforeend', optimizationStyles);

    // Export des utilitaires pour usage global
    window.PerformanceConfig = PerformanceConfig;
    window.MemoryManager = MemoryManager;
    window.NetworkOptimizer = NetworkOptimizer;
    window.AccessibilityOptimizer = AccessibilityOptimizer;

    // Auto-initialisation
    AutoInitializer.init();

    console.log('🏛️ Performance Config ADEME Table Parfaite chargé - Optimisations maximales activées!');

})();