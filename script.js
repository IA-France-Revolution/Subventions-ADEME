
(function() {
    'use strict';

    // Global state for the application
    const appState = {
        rawData: [],
        filteredData: [],
        charts: {},
        dataTable: null,
        dataUrl: 'https://ia-france-revolution.github.io/Subventions-ADEME/Les%20aides%20financieres%20ADEME.csv',
        currentFilters: {},
        lastDataTimestamp: "Non disponible",
        shareStats: {
            totalShares: 0,
            twitterShares: 0,
            linkedinShares: 0,
            facebookShares: 0,
            copyShares: 0
        },
        hasAnimatedMetrics: false,
        sharePanelExpandedWidth: '290px', // Default expanded width of share panel
        sharePanelCollapsedWidth: '50px'  // Default collapsed width
    };

    // Chart.js Global Configuration (unchanged)
    Chart.defaults.font.family = 'Poppins, sans-serif';
    Chart.defaults.font.size = 12;
    Chart.defaults.color = '#333';
    Chart.defaults.plugins.legend.position = 'bottom';
    Chart.defaults.plugins.legend.labels.boxWidth = 12;
    Chart.defaults.plugins.legend.labels.padding = 15;
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(0,0,0,0.8)';
    Chart.defaults.plugins.tooltip.titleFont = { size: 14, weight: 'bold' };
    Chart.defaults.plugins.tooltip.bodyFont = { size: 12 };
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 6;
    Chart.defaults.plugins.tooltip.displayColors = false; 

    const formatCurrency = (value, locale = 'fr-FR', currency = 'EUR') => {
        if (typeof value !== 'number' || isNaN(value)) return 'N/A';
        return new Intl.NumberFormat(locale, { style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
    };

    const formatDate = (dateString) => {
        if (!dateString || dateString === 'N/A') return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) { 
                const parts = dateString.split('-');
                if (parts.length === 3) {
                    const year = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1; 
                    const day = parseInt(parts[2], 10);
                    const manualDate = new Date(Date.UTC(year, month, day)); 
                    if (!isNaN(manualDate.getTime())) {
                        return manualDate.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
                    }
                }
                return dateString; 
            }
            return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch (e) {
            console.warn(`Error formatting date: ${dateString}`, e);
            return dateString; 
        }
    };

    const formatNumber = (value) => {
        if (typeof value !== 'number' || isNaN(value)) return '0';
        return value.toLocaleString('fr-FR');
    };

    const smartTruncate = (text, maxLength, showTooltip = true) => {
        if (!text || text.length <= maxLength) return _.escape(text);
        const truncated = text.substring(0, maxLength).trim();
        return showTooltip ? 
            `<span title="${_.escape(text)}" class="smart-truncated" data-full-text="${_.escape(text)}">${_.escape(truncated)}...</span>` :
            _.escape(truncated) + '...';
    };

    const formatObjectText = (text) => {
        if (!text) return '';
        return _.escape(text); 
    };

    const showElement = (selector) => $(selector).show();
    const hideElement = (selector) => $(selector).hide();

    function getCachedData() {
        try {
            const cached = localStorage.getItem('ademe_cache_data');
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.warn('Error reading cache:', error);
            return null;
        }
    }

    function setCachedData(data) {
        try {
            const cacheObject = {
                data: data,
                timestamp: Date.now(),
                version: '1.2.1' // Incremented version for cache busting if structure changes
            };
            localStorage.setItem('ademe_cache_data', JSON.stringify(cacheObject));
            showNotification('💾 Données mises en cache pour un accès plus rapide', 'success');
        } catch (error) {
            console.warn('Error saving cache:', error);
        }
    }

    function clearCache() {
        try {
            localStorage.removeItem('ademe_cache_data');
            localStorage.removeItem('sharePanelCollapsed'); // Also clear panel state
            showNotification('🗑️ Cache vidé avec succès', 'info');
        } catch (error) {
            console.warn('Error clearing cache:', error);
        }
    }

    // DOMContentLoaded
    $(document).ready(function() {
        initializePage();
        initializeSharePanelToggle(); // Initialize share panel state and toggle
        fetchAndProcessData();
        setupEventListeners();
        initializeShareFeatures();
    });

    function initializePage() {
        hideElement('#dashboardContent');
        showElement('#pageLoader');
        $('#pageLoader').attr('aria-busy', 'true');
        document.title = "Tableau de Bord - Aides Financières ADEME | Analyse Transparente";
        $('#lastDataUpdate').text(new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }));
        updateShareStatsDisplay();
    }

    function setupEventListeners() {
        $('.burger').on('click', function() {
            const isActive = $('.nav-links').toggleClass('active').hasClass('active');
            $(this).toggleClass('active').attr('aria-expanded', isActive);
            $('.nav-links li').each(function(i) {
                $(this).css('animation-delay', `${i * 0.1 + 0.1}s`).toggleClass('fade-in');
            });
        });

        $(window).on('scroll', function() {
            $('.nav-container').toggleClass('scrolled', $(window).scrollTop() > 50);
            $('.scroll-to-top').toggleClass('active', $(window).scrollTop() > 300);
        });

        $('.scroll-to-top').on('click', function(e) {
            e.preventDefault();
            $('html, body').animate({ scrollTop: 0 }, 500);
        });

        $('.nav-links a').on('click', function() {
            if ($('.burger').is(':visible')) {
                $('.nav-links').removeClass('active');
                $('.burger').removeClass('active').attr('aria-expanded', 'false');
                $('.nav-links li').removeClass('fade-in');
            }
            $('.nav-links a').removeClass('active');
            $(this).addClass('active');
        });

        $('#applyFiltersButton').on('click', applyAllFilters);
        $('#resetFiltersButton').on('click', resetAllFilters);
        $('#globalSearch').on('keyup', _.debounce(applyAllFilters, 350));
        $('#yearFilter, #procedureFilter').on('change', applyAllFilters);
        $('#minAmountFilter, #maxAmountFilter').on('blur', applyAllFilters);

        $('#expandAllRows').on('click', function() {
            if (appState.dataTable) {
                appState.dataTable.rows().every(function() {
                    const row = this; if (!row.child.isShown()) {
                        const $tr = $(row.node()), $button = $tr.find('.show-details-btn'), $icon = $button.find('i');
                        row.child(formatDetailRowAdeme(row.data()), 'detail-row').show();
                        $tr.addClass('shown'); $icon.removeClass('fa-plus-circle').addClass('fa-minus-circle shown');
                        $button.attr('aria-label', 'Masquer les détails').attr('aria-expanded', 'true');
                    }});
                showNotification('Tous les détails ont été développés.', 'info');
            }});

        $('#collapseAllRows').on('click', function() {
            if (appState.dataTable) {
                appState.dataTable.rows().every(function() {
                    const row = this; if (row.child.isShown()) {
                        const $tr = $(row.node()), $button = $tr.find('.show-details-btn'), $icon = $button.find('i');
                        row.child.hide(); $tr.removeClass('shown');
                        $icon.removeClass('fa-minus-circle shown').addClass('fa-plus-circle');
                        $button.attr('aria-label', 'Afficher les détails').attr('aria-expanded', 'false');
                    }});
                showNotification('Tous les détails ont été réduits.', 'info');
            }});
        
        $(document).on('click', '.smart-truncated', function(e) {
            e.stopPropagation(); const fullText = $(this).data('full-text');
            if (fullText) showNotification(`📋 ${fullText}`, 'info');
        });

        const tableContainer = $('.table-container');
        if (tableContainer.length) {
            tableContainer.on('scroll', function(){
                $(this).toggleClass('scrolled-horizontal', $(this).scrollLeft() > 0);
            });
        }
    }

    function initializeSharePanelToggle() {
        const $sharePanel = $('#share-section');
        const $toggleButton = $('#toggleShareSection');
        const $mainDashboard = $('main.dashboard');
        const $buttonIcon = $toggleButton.find('i');

        const setPanelState = (isCollapsed) => {
            if (isCollapsed) {
                $sharePanel.addClass('collapsed');
                $mainDashboard.addClass('share-panel-collapsed');
                if (window.innerWidth > 1200) { // Only adjust padding if panel is fixed
                    $mainDashboard.css('padding-left', appState.sharePanelCollapsedWidth);
                }
                $buttonIcon.removeClass('fa-chevron-left').addClass('fa-chevron-right');
                $toggleButton.attr('aria-label', 'Étendre le panneau de partage').attr('aria-expanded', 'false');
                $toggleButton.attr('title', 'Étendre le panneau de partage');
            } else {
                $sharePanel.removeClass('collapsed');
                $mainDashboard.removeClass('share-panel-collapsed');
                 if (window.innerWidth > 1200) {
                    $mainDashboard.css('padding-left', appState.sharePanelExpandedWidth);
                }
                $buttonIcon.removeClass('fa-chevron-right').addClass('fa-chevron-left');
                $toggleButton.attr('aria-label', 'Réduire le panneau de partage').attr('aria-expanded', 'true');
                $toggleButton.attr('title', 'Réduire le panneau de partage');
            }
            localStorage.setItem('sharePanelCollapsed', isCollapsed);
        };

        $toggleButton.on('click', function() {
            setPanelState(!$sharePanel.hasClass('collapsed'));
        });

        // Apply initial state from localStorage
        const initiallyCollapsed = localStorage.getItem('sharePanelCollapsed') === 'true';
        setPanelState(initiallyCollapsed);

        // Adjust padding on resize if panel is fixed
         $(window).on('resize', _.debounce(function() {
            if (window.innerWidth > 1200) {
                if ($sharePanel.hasClass('collapsed')) {
                    $mainDashboard.css('padding-left', appState.sharePanelCollapsedWidth);
                } else {
                    $mainDashboard.css('padding-left', appState.sharePanelExpandedWidth);
                }
            } else {
                $mainDashboard.css('padding-left', ''); // Reset padding for smaller screens
            }
        }, 200));
    }


    function initializeShareFeatures() {
        $('#shareTwitter').on('click', () => shareOnPlatform('twitter'));
        $('#shareLinkedin').on('click', () => shareOnPlatform('linkedin'));
        // ... (other share buttons)
        $('#copyLink').on('click', () => copyToClipboard());

        $('#closeShareModal').on('click', () => hideElement('#shareModal'));
        // ... (other modal logic)
        
        if (!$('.cache-controls').length) { 
            $('body').append(`
                <div class="cache-controls">
                    <button class="cache-btn" id="clearCacheBtn" title="Vider le cache des données">
                        🗑️ Vider Cache
                    </button>
                    <button class="cache-btn" id="refreshDataBtn" title="Recharger les données">
                        🔄 Actualiser
                    </button>
                </div>
            `);
        }
        
        $('#clearCacheBtn').off('click').on('click', () => { 
            clearCache();
            showNotification('🗑️ Cache vidé ! Rechargement des données...', 'info');
            setTimeout(() => window.location.reload(), 1000);
        });
        
        $('#refreshDataBtn').off('click').on('click', () => {
            // Clearing cache on manual refresh ensures fresh data
            localStorage.removeItem('ademe_cache_data'); 
            showNotification('🔄 Actualisation des données...', 'info');
            setTimeout(() => window.location.reload(), 500);
        });
    }

    function shareOnPlatform(platform) { /* ... (unchanged from previous) ... */ 
        const baseUrl = window.location.origin + window.location.pathname;
        const title = "Analyse des Aides Financières ADEME - Transparence Démocratique";
        const description = `Découvrez l'analyse interactive des ${formatNumber(appState.rawData.length)} aides ADEME pour un montant total de ${formatCurrency(appState.rawData.reduce((sum, item) => sum + item.montant, 0))}. Données transparentes pour la démocratie.`;
        const hashtags = "ADEME,TransparenceDémocratique,AidesFinancières,EnvironnementFrance,DonnéesPubliques";
        
        let shareUrl = '';
        
        switch(platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(baseUrl)}&hashtags=${encodeURIComponent(hashtags)}&via=AIFR_AI`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(baseUrl)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description)}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(baseUrl)}"e=${encodeURIComponent(title + ' - ' + description)}`;
                break;
            case 'telegram':
                shareUrl = `https://t.me/share/url?url=${encodeURIComponent(baseUrl)}&text=${encodeURIComponent(title + '\n\n' + description)}`;
                break;
            case 'email':
                const emailSubject = encodeURIComponent(title);
                const emailBody = encodeURIComponent(`${description}\n\nConsultez l'analyse complète : ${baseUrl}\n\nRéalisé par AI France Revolution pour la transparence démocratique.`);
                shareUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`;
                break;
        }
        
        if (shareUrl) {
            if (platform === 'email') {
                window.location.href = shareUrl;
            } else {
                window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
            }
            
            appState.shareStats.totalShares++;
            if (appState.shareStats[`${platform}Shares`] !== undefined) {
                appState.shareStats[`${platform}Shares`]++;
            }
            updateShareStatsDisplay();
            showNotification(`Contenu partagé sur ${platform.charAt(0).toUpperCase() + platform.slice(1)} !`, 'success');
        }
    }
    function copyToClipboard() { /* ... (unchanged) ... */ 
        const url = window.location.href;
        
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(url).then(() => {
                appState.shareStats.totalShares++;
                appState.shareStats.copyShares++;
                updateShareStatsDisplay();
                showNotification('Lien copié dans le presse-papiers !', 'success');
            }).catch(() => {
                fallbackCopyToClipboard(url);
            });
        } else {
            fallbackCopyToClipboard(url);
        }
    }
    function fallbackCopyToClipboard(text) { /* ... (unchanged) ... */ 
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            appState.shareStats.totalShares++;
            appState.shareStats.copyShares++;
            updateShareStatsDisplay();
            showNotification('Lien copié dans le presse-papiers !', 'success');
        } catch (err) {
            showNotification('Impossible de copier le lien. Veuillez le sélectionner manuellement.', 'error');
        }
        
        document.body.removeChild(textArea);
    }
    function shareFilteredData(platform) { /* ... (unchanged) ... */ 
        const filterSummary = generateFilterSummary();
        const baseUrl = window.location.origin + window.location.pathname;
        const title = `Analyse ADEME Filtrée - ${filterSummary.title}`;
        const description = `${filterSummary.description} Découvrez ces données sur la transparence des aides ADEME.`;
        
        let shareUrl = '';
        
        switch(platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(baseUrl)}&hashtags=ADEME,TransparenceDémocratique&via=AIFR_AI`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(baseUrl)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description)}`;
                break;
        }
        
        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
            showNotification('Données filtrées partagées !', 'success');
        }
    }
    function copyFilteredLink() { /* ... (unchanged) ... */ 
        const params = new URLSearchParams();
        
        Object.entries(appState.currentFilters).forEach(([key, value]) => {
            if (value && value !== '' && value !== 0 && value !== Infinity) {
                params.append(key, value);
            }
        });
        
        const url = window.location.origin + window.location.pathname + 
                   (params.toString() ? '?' + params.toString() : '');
        
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(url).then(() => {
                showNotification('Lien avec filtres copié !', 'success');
            });
        } else {
            fallbackCopyToClipboard(url);
        }
    }
    function generateFilterSummary() { /* ... (unchanged) ... */ 
        const filters = appState.currentFilters;
        const data = appState.filteredData;
        const totalAmount = data.reduce((sum, item) => sum + item.montant, 0);
        
        let title = `${formatNumber(data.length)} aides ADEME`;
        let description = `Montant total: ${formatCurrency(totalAmount)}`;
        
        if (filters.selectedYear) {
            title += ` en ${filters.selectedYear}`;
        }
        
        if (filters.selectedDispositif) {
            title += ` (${filters.selectedDispositif.substring(0, 30)}...)`;
        }
        
        return { title, description };
    }
    function updateShareStatsDisplay() { /* ... (unchanged) ... */ 
        const statsContainer = $('#shareStats');
        if (appState.shareStats.totalShares > 0) {
            statsContainer.html(`
                <h4><i class="fas fa-chart-line"></i> Statistiques de Partage</h4>
                <div class="share-stats-grid">
                    <div class="share-stat-item">
                        <div class="share-stat-value">${appState.shareStats.totalShares}</div>
                        <div class="share-stat-label">Total Partages</div>
                    </div>
                    <div class="share-stat-item">
                        <div class="share-stat-value">${appState.shareStats.twitterShares}</div>
                        <div class="share-stat-label">Twitter</div>
                    </div>
                    <div class="share-stat-item">
                        <div class="share-stat-value">${appState.shareStats.linkedinShares}</div>
                        <div class="share-stat-label">LinkedIn</div>
                    </div>
                    <div class="share-stat-item">
                        <div class="share-stat-value">${appState.shareStats.copyShares}</div>
                        <div class="share-stat-label">Liens Copiés</div>
                    </div>
                </div>
            `);
        } else {
            statsContainer.empty(); // Clear if no shares
        }
    }

    function animateMetricCards() { /* ... (unchanged from previous) ... */ 
        const cards = $('.stat-value'); 
        cards.css({ transform: 'scale(0.8)', opacity: 0 });
        setTimeout(() => { 
            cards.each(function(i, el){
                setTimeout(() => { 
                    $(el).animate({
                        opacity: 1, 
                    }, {
                        duration: 400,
                        step(now) { 
                            $(el).css('transform', `scale(${0.8 + (now * 0.2)})`);
                        },
                        complete() {
                            $(el).css({ transform: 'scale(1)', opacity: 1 });
                        }
                    });
                }, i * 150); 
            });
        }, 500); 
    }


    function fetchAndProcessData() { /* ... (unchanged from previous) ... */ 
        const loadingMessages = [
            'Récupération des données sur l\'usage de vos impôts...',
            'Analyse des subventions ADEME financées par les contribuables...',
            'Chargement des aides publiques pour la transparence démocratique...',
            'Extraction des données sur l\'argent public distribué...',
            'Décryptage de la répartition des fonds environnementaux...'
        ];
        
        let messageIndex = 0;
        $('#loadingProgressMessage').text(loadingMessages[messageIndex]);
        
        const messageInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % loadingMessages.length;
            $('#loadingProgressMessage').text(loadingMessages[messageIndex]);
        }, 2000);

        console.log(`Fetching data from: ${appState.dataUrl}`);

        const cachedData = getCachedData();
        if (cachedData && cachedData.timestamp && (Date.now() - cachedData.timestamp) < 30 * 60 * 1000) {
            clearInterval(messageInterval);
            $('#loadingProgressMessage').text('💾 Données récupérées depuis le cache local...');
            $('#tableStatus').text('💾 Données en cache').addClass('cached').show();
            console.log('Using cached data');
            processRawData(cachedData.data);
            return;
        } else {
            $('#tableStatus').text('📡 Chargement...').addClass('loading').show();
        }

        fetch(appState.dataUrl)
            .then(response => {
                clearInterval(messageInterval);
                if (!response.ok) {
                    throw new Error(`Erreur HTTP ${response.status} (${response.statusText}) lors du téléchargement du fichier CSV.`);
                }
                const contentType = response.headers.get("content-type");
                if (contentType && !contentType.includes("text/csv") && !contentType.includes("application/csv") && !contentType.includes("text/plain")) {
                     console.warn(`Type de contenu inattendu: ${contentType}. Tentative de traitement en tant que CSV.`);
                }
                $('#loadingProgressMessage').text('📊 Parsing des données gouvernementales...');
                return response.text();
            })
            .then(csvText => {
                $('#loadingProgressMessage').text('🔍 Normalisation et validation des données...');
                setCachedData(csvText);
                processRawData(csvText);
            })
            .catch(networkOrHttpError => {
                clearInterval(messageInterval);
                $('#pageLoader').attr('aria-busy', 'false');
                console.error("Erreur de chargement réseau ou HTTP (via fetch):", networkOrHttpError);
                
                const cachedDataOnError = getCachedData(); 
                if (cachedDataOnError) {
                    showNotification('🔄 Connexion impossible, utilisation des données en cache', 'warning');
                    processRawData(cachedDataOnError.data); 
                    return;
                }
                
                let message = `🚫 Impossible de télécharger les données ADEME depuis ${appState.dataUrl}. Détail: ${networkOrHttpError.message}.`;
                showError(message + " Vérifiez votre connexion internet ou les éventuelles maintenances de data.gouv.fr.");
            });
    }
    function processRawData(csvText) { /* ... (unchanged from previous) ... */ 
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false, 
            worker: false,
            complete: function(results) {
                $('#loadingProgressMessage').text('✨ Finalisation du tableau de bord...');
                $('#pageLoader').attr('aria-busy', 'false');

                if (!results) {
                    console.error("Papa.parse 'complete' callback received undefined results object.");
                    showError("Une erreur critique est survenue lors du traitement des données (objet 'results' indéfini).");
                    return;
                }

                if (results.errors && results.errors.length > 0) {
                    console.warn("Erreurs de parsing Papaparse:", results.errors);
                    let errorMsg = `⚠️ ${results.errors.length} erreur(s) détectée(s) dans les données ADEME. Certaines lignes pourraient être incorrectes.`;
                    if (results.errors[0] && results.errors[0].message) {
                        errorMsg += ` Détail: ${results.errors[0].message}`;
                    }
                    showNotification(errorMsg, 'warning');
                }
                
                let rawData = results.data || [];
                
                if (!Array.isArray(rawData) || (rawData.length > 0 && typeof rawData[0] !== 'object')) {
                    console.error("Format de données inattendu après parsing. Attendu: tableau d'objets. Reçu:", rawData);
                    showError("Le format des données CSV ADEME n'est pas celui attendu après le parsing.");
                    rawData = []; 
                }
                
                console.log(`Nombre de lignes parsées initialement: ${rawData.length}`);
                appState.rawData = normalizeDataAdeme(rawData);
                console.log(`Nombre de lignes après normalisation et filtrage initial: ${appState.rawData.length}`);
                appState.filteredData = [...appState.rawData];
                
                if (appState.rawData.length === 0 && rawData.length > 0) {
                     showError("❌ Aucune donnée ADEME valide n'a pu être extraite après normalisation. Vérifiez la console pour les erreurs de parsing.");
                } else if (appState.rawData.length === 0) {
                    showError("📭 Aucune donnée ADEME n'a été chargée. Le fichier source semble vide ou inaccessible.");
                }
                else {
                    setTimeout(() => {
                        populateFiltersAdeme();
                        updateDashboardAdeme();
                        hideElement('#pageLoader');
                        showElement('#dashboardContent');
                        
                        const isFromCache = $('#tableStatus').hasClass('cached');
                        if (!isFromCache) {
                            $('#tableStatus').text('📊 Données en direct').removeClass('loading').show();
                        }
                        
                        if (!appState.hasAnimatedMetrics) {
                            animateMetricCards();
                            appState.hasAnimatedMetrics = true;
                        }

                        const successMsg = `🎉 ${formatNumber(appState.rawData.length)} aides ADEME chargées ! ` +
                                         `Montant total analysé: ${formatCurrency(appState.rawData.reduce((sum, item) => sum + item.montant, 0))}` +
                                         (isFromCache ? ' (depuis le cache)' : ' (données fraîches)');
                        showNotification(successMsg, 'success');
                    }, 100);
                }
            },
            error: function(error) {
                $('#pageLoader').attr('aria-busy', 'false');
                console.error("Erreur de parsing PapaParse:", error);
                let message = `🔧 Impossible de parser les données CSV ADEME.`;
                if (error && error.message) message += ` Détail: ${error.message}`;
                else if (typeof error === 'string') message += ` Détail: ${error}`;
                showError(message);
            }
        });
    }
    function showError(message) { /* ... (unchanged) ... */ 
        $('#errorMessageText').html(message); 
        hideElement('#pageLoader');
        hideElement('#dashboardContent'); 
        showElement('#errorMessage');
    }
    function normalizeDataAdeme(data) { /* ... (unchanged from previous) ... */ 
        return data.map((item, index) => {
            const montantStr = String(item.montant || '0').replace(',', '.'); 
            const montantValue = parseFloat(montantStr);

            let annee = null;
            const dateConvention = item.dateConvention; 
            if (dateConvention) {
                try {
                    const d = new Date(dateConvention); 
                    if (!isNaN(d.getFullYear())) {
                        annee = d.getFullYear();
                    } else if (typeof dateConvention === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateConvention)) {
                        annee = parseInt(dateConvention.substring(0, 4), 10);
                    }
                } catch (e) {
                    console.warn(`Could not parse year from dateConvention: ${dateConvention}`);
                }
            }
            
            const nomBeneficiaire = String(item.nomBeneficiaire || 'Non spécifié').trim();
            const objetAide = String(item.objet || 'Non spécifié').trim();
            const dispositif = String(item.dispositifAide || 'Non spécifié').trim();

            return {
                id: String(item.referenceDecision || item.idBeneficiaire || `ademe_${index}`), 
                objet: objetAide,
                nomBeneficiaire: nomBeneficiaire,
                dateNotification: dateConvention || 'N/A', 
                montant: isNaN(montantValue) ? null : montantValue, 
                dispositifAide: dispositif, 
                annee: annee, 
                natureAide: String(item.natureAide || item.nature || 'Non spécifié').trim(),
                conditionsVersement: String(item.conditionsVersement || 'Non spécifié').trim(),
                datesPeriodeVersement: String(item.datesPeriodeVersement || 'N/A').trim(),
                notificationUE: String(item.notificationUE || 'N/A').trim(),
                idBeneficiaire: String(item.idBeneficiaire || 'N/A').trim(),
            };
        }).filter(item => 
            item.montant !== null && item.montant >= 0 && 
            item.annee !== null && 
            item.nomBeneficiaire !== 'Non spécifié' && item.nomBeneficiaire !== '' && 
            item.objet !== 'Non spécifié' && item.objet !== '' 
        );
    }
    function populateFiltersAdeme() { /* ... (unchanged) ... */ 
        const years = _.uniq(appState.rawData.map(d => d.annee))
                       .filter(y => y !== null)
                       .sort((a, b) => b - a);
        const yearFilter = $('#yearFilter');
        yearFilter.empty().append(new Option('Toutes les années', ''));
        years.forEach(year => yearFilter.append(new Option(year, year)));

        const dispositifs = _.uniq(appState.rawData.map(d => d.dispositifAide))
                             .filter(d => d && d.trim() !== '' && d.trim() !== 'Non spécifié')
                             .sort();
        const procedureFilter = $('#procedureFilter'); 
        procedureFilter.empty().append(new Option('Tous les dispositifs', ''));
        dispositifs.forEach(disp => {
            const optionText = disp.length > 40 ? disp.substring(0, 37) + '...' : disp;
            procedureFilter.append(new Option(optionText, disp));
        });
    }
    function applyAllFilters() { /* ... (unchanged from previous) ... */ 
        const globalSearchTerm = $('#globalSearch').val().toLowerCase().trim();
        const selectedYear = $('#yearFilter').val();
        const selectedDispositif = $('#procedureFilter').val(); 
        const minAmount = parseFloat($('#minAmountFilter').val()) || 0;
        
        const maxAmountFilterValue = $('#maxAmountFilter').val();
        const maxAmountInput = parseFloat(maxAmountFilterValue);
        const maxAmount = maxAmountFilterValue.trim() === '' || isNaN(maxAmountInput) ? Infinity : maxAmountInput;

        appState.currentFilters = {
            globalSearchTerm, selectedYear, selectedDispositif, minAmount, maxAmount
        };
        
        if (appState.rawData.length === 0) {
            appState.filteredData = [];
        } else {
            appState.filteredData = appState.rawData.filter(item => {
                const yearMatch = !selectedYear || item.annee == selectedYear;
                const dispositifMatch = !selectedDispositif || item.dispositifAide === selectedDispositif;
                const amountMatch = item.montant >= minAmount && item.montant <= maxAmount;
                
                let searchMatch = true;
                if (globalSearchTerm) {
                    searchMatch = (
                        String(item.objet).toLowerCase().includes(globalSearchTerm) ||
                        String(item.nomBeneficiaire).toLowerCase().includes(globalSearchTerm) ||
                        String(item.dispositifAide).toLowerCase().includes(globalSearchTerm) ||
                        String(item.idBeneficiaire).toLowerCase().includes(globalSearchTerm) ||
                        String(item.id).toLowerCase().includes(globalSearchTerm)
                    );
                }
                return yearMatch && dispositifMatch && amountMatch && searchMatch;
            });
        }
        updateActiveFiltersDisplayAdeme();
        updateDashboardAdeme(); 
        if (appState.rawData.length > 0) { 
            showNotification(`${formatNumber(appState.filteredData.length)} aides trouvées correspondant à vos critères.`, 'info');
        }
    }
    function updateActiveFiltersDisplayAdeme() { /* ... (unchanged) ... */ 
        const display = $('#activeFiltersDisplay');
        display.empty();
        const { globalSearchTerm, selectedYear, selectedDispositif, minAmount, maxAmount } = appState.currentFilters;

        const addPill = (label, value, clearFn) => {
            if (value || (typeof value === 'string' && value.trim() !== '')) { 
                const displayValue = String(value).length > 30 ? String(value).substring(0, 27) + '...' : String(value);
                 display.append(createFilterPill(label, displayValue, clearFn));
            }
        };
        
        addPill('Recherche', globalSearchTerm, () => { $('#globalSearch').val(''); applyAllFilters(); });
        addPill('Année', selectedYear, () => { $('#yearFilter').val(''); applyAllFilters(); });
        addPill('Dispositif', selectedDispositif, () => { $('#procedureFilter').val(''); applyAllFilters(); });
        if (minAmount > 0) addPill('Montant Min', formatCurrency(minAmount), () => { $('#minAmountFilter').val(''); applyAllFilters(); });
        if (maxAmount !== Infinity && maxAmount >= 0) addPill('Montant Max', formatCurrency(maxAmount), () => { $('#maxAmountFilter').val(''); applyAllFilters(); });
    }
    function createFilterPill(label, value, clearCallback) { /* ... (unchanged) ... */ 
        return $(`<span class="filter-pill"><span>${_.escape(label)}:</span> <strong>${_.escape(value)}</strong> <button title="Retirer ce filtre" aria-label="Retirer filtre ${_.escape(label)}">×</button></span>`)
            .find('button').on('click', clearCallback).end();
    }
    function resetAllFilters() { /* ... (unchanged) ... */ 
        $('#globalSearch').val('');
        $('#yearFilter').val('');
        $('#procedureFilter').val(''); 
        $('#minAmountFilter').val('');
        $('#maxAmountFilter').val('');
        
        appState.currentFilters = {}; 
        appState.filteredData = [...appState.rawData]; 
        
        updateActiveFiltersDisplayAdeme(); 
        updateDashboardAdeme(); 
        showNotification('Tous les filtres ont été réinitialisés.', 'info');
    }
    function updateDashboardAdeme() { /* ... (unchanged) ... */ 
        updateStatisticsAdeme();
        initializeDataTableAdeme(); 
        updateChartsAdeme();
        updateFilterMetrics();
        updateFooterMetrics();
    }
    function updateStatisticsAdeme() { /* ... (unchanged from previous) ... */ 
        const data = appState.filteredData;
        $('#totalContracts').text(formatNumber(data.length));
        
        const totalAmount = data.reduce((sum, item) => sum + item.montant, 0);
        $('#totalAmount').text(formatCurrency(totalAmount));

        const averageAmount = data.length ? totalAmount / data.length : 0;
        $('#averageAmount').text(formatCurrency(averageAmount));

        if (data.length > 0) {
            const sortedAmounts = data.map(item => item.montant).sort((a, b) => a - b);
            const mid = Math.floor(data.length / 2);
            const medianAmount = data.length % 2 === 0 ?
                (sortedAmounts[mid - 1] + sortedAmounts[mid]) / 2 :
                sortedAmounts[mid];
            $('#medianAmount').text(formatCurrency(medianAmount));
        } else {
            $('#medianAmount').text(formatCurrency(0));
        }
        
        $('#uniqueBuyersContainer').hide(); 

        $('#uniqueSuppliers').text(data.length > 0 ? formatNumber(_.uniqBy(data, 'idBeneficiaire').length) : '0');
        
        if (data.length > 0) {
            const yearsInData = _.uniq(data.map(d => d.annee)).filter(y => y !== null);
            const yearsCovered = yearsInData.length;
            $('#dataCoverageYears').text(yearsCovered > 1 ? `${_.min(yearsInData)} - ${_.max(yearsInData)}` : (yearsCovered === 1 ? String(_.min(yearsInData)) : '0'));
        } else {
            $('#dataCoverageYears').text('0');
        }
    }

    function initializeDataTableAdeme() {
        const data = appState.filteredData;

        if (appState.dataTable && $.fn.DataTable.isDataTable('#contractsTable')) { 
            appState.dataTable.destroy();
            $('#contractsTable').empty(); 
        }

        const tableData = data.map(item => ({
            _id: item.id, _objetComplet: item.objet, _nomBeneficiaireComplet: item.nomBeneficiaire,
            _dispositifAideComplet: item.dispositifAide, _conditionsVersement: item.conditionsVersement,
            _datesPeriodeVersement: item.datesPeriodeVersement, _notificationUE: item.notificationUE,
            _idBeneficiaire: item.idBeneficiaire, _natureAide: item.natureAide,
            _dateNotificationRaw: item.dateNotification, 
            objet: formatObjectText(item.objet), 
            nomBeneficiaire: item.nomBeneficiaire.length > 50 ? smartTruncate(item.nomBeneficiaire, 47, true) : _.escape(item.nomBeneficiaire),
            dateNotification: formatDate(item.dateNotification), montant: item.montant, 
            montantFormatted: formatCurrency(item.montant),
            dispositifAide: item.dispositifAide.length > 30 ? smartTruncate(item.dispositifAide, 27, true) : _.escape(item.dispositifAide),
            conditionsVersementDisplay: item.conditionsVersement.length > 15 ? smartTruncate(item.conditionsVersement, 12, true) : _.escape(item.conditionsVersement)
        }));
        
        $('#contractsTable').html(`
            <thead>
              <tr>
                <th></th> <th>Objet de l’aide</th> <th>Bénéficiaire</th> <th>Montant (€)</th>
                <th>Date</th> <th>Dispositif</th> <th>Conditions</th>
              </tr>
            </thead>
            <tbody></tbody>`);

        appState.dataTable = $('#contractsTable').DataTable({
            data: tableData,
            columns: [
                { className: 'details-control', orderable: false, data: null, defaultContent: '<button class="show-details-btn" aria-label="Afficher les détails" aria-expanded="false"><i class="fas fa-plus-circle" aria-hidden="true"></i></button>',},
                { data: 'objet', title: 'Objet de l’aide' }, { data: 'nomBeneficiaire', title: 'Bénéficiaire' },
                { data: 'montant', title: 'Montant (€)', render: (d,t,r) => t === 'display' ? r.montantFormatted : d },
                { data: 'dateNotification', title: 'Date', type: 'date-fr' },
                { data: 'dispositifAide', title: 'Dispositif' },
                { data: 'conditionsVersementDisplay', title: 'Conditions' }
            ],
            responsive: false, scrollX: false, scrollCollapse: true, autoWidth: false, 
            pageLength: 20, 
            lengthMenu: [[20, 50, 100, 200, -1], [20, 50, 100, 200, "Tout"]],
            language: { url: "https://cdn.datatables.net/plug-ins/1.13.6/i18n/fr-FR.json",
                emptyTable: "💸 Aucune aide trouvée...", zeroRecords: "🔍 Aucune aide correspondante...",
                info: "Page _PAGE_ sur _PAGES_ (_TOTAL_ aides)", infoEmpty: "📋 Aucune aide",
                infoFiltered: "(filtrées parmi _MAX_ aides)" },
            dom: "<'row'<'col-sm-12 col-md-6'lB><'col-sm-12 col-md-6'f>>" + 
                 "<'row'<'col-sm-12'tr>>" +                                 
                 "<'row'<'col-sm-12 col-md-5 dataTables_info_custom'i><'col-sm-12 col-md-7 dataTables_paginate_custom'p>>",   
            buttons: [ 
                { extend: 'copyHtml5', text: '<i class="fas fa-copy" aria-hidden="true"></i> Copier', titleAttr: 'Copier les données visibles', className: 'btn-sm' },
                { extend: 'excelHtml5', text: '<i class="fas fa-file-excel" aria-hidden="true"></i> Excel', titleAttr: 'Exporter en Excel', className: 'btn-sm', filename: () => `aides_ademe_${new Date().toISOString().slice(0,10)}` },
                { extend: 'csvHtml5', text: '<i class="fas fa-file-csv" aria-hidden="true"></i> CSV', titleAttr: 'Exporter en CSV', className: 'btn-sm', filename: () => `aides_ademe_${new Date().toISOString().slice(0,10)}` },
                { 
                    extend: 'pdfHtml5', 
                    text: '<i class="fas fa-file-pdf" aria-hidden="true"></i> PDF', 
                    titleAttr: 'Exporter en PDF', 
                    orientation: 'landscape', 
                    pageSize: 'A3', 
                    className: 'btn-sm', 
                    filename: () => `aides_ademe_${new Date().toISOString().slice(0,10)}`,
                    customize: function(doc) {
                        const reportWidths = ['5%', '40%', '18%', '12%', '8%', '12%', '5%']; 
                        doc.content[1].table.widths = reportWidths;
                        doc.styles.tableHeader.fontSize = 8;
                        doc.defaultStyle.fontSize = 7;
                    }
                }
            ],
            order: [[3, 'desc']], 
            columnDefs: [ { targets: [0], orderable: false }, { targets: [3], type: 'num-fmt' }, { targets: [4], type: 'date-fr' }],
            pagingType: 'simple_numbers', // CHANGED FOR BETTER UX
            drawCallback: function () { 
                var api = this.api(); 
                var pageInfo = api.page.info();
                var $infoContainer = $(api.table().container()).find('.dataTables_info_custom');

                if (pageInfo.recordsTotal > 0) {
                    const totalAmount = appState.filteredData.reduce((sum, item) => sum + item.montant, 0);
                     $infoContainer.html(`
                        Page ${pageInfo.page + 1} / ${pageInfo.pages} (${formatNumber(pageInfo.recordsDisplay)} sur ${formatNumber(pageInfo.recordsTotal)} aides)
                        <br>Total affiché: ${formatCurrency(totalAmount)}
                    `);
                } else if (pageInfo.recordsTotal === 0 && appState.rawData.length > 0) {
                     $infoContainer.html('Aucune aide ne correspond à vos critères.');
                } else {
                     $infoContainer.html('Aucune aide à afficher.');
                }
                $('.smart-truncated').hover(function(){$(this).addClass('highlight');},function(){$(this).removeClass('highlight');});
            },
            createdRow: function(row,data,dataIndex) { 
                var dtInstance = this.api(); 
                $(row).find('td').each(function(columnIndex){
                    const columnSettings = dtInstance.settings()[0].aoColumns[columnIndex];
                    if (columnSettings && columnSettings.title) {
                        $(this).attr('data-label', columnSettings.title);
                    }
                });
                $(row).addClass('table-row-enhanced');
            }
        });

        if (window.moment && $.fn.dataTable.moment) {  
            $.fn.dataTable.moment('DD MMM YYYY', 'fr'); 
        } else if (!$.fn.dataTable.ext.type.order['date-fr-pre']) {
             $.extend($.fn.dataTable.ext.type.order, {
                "date-fr-pre": function (d) {
                    if (!d || typeof d !== 'string') return 0;
                    var frMonths = { "janv.": "01", "févr.": "02", "mars": "03", "avr.": "04", "mai": "05", "juin": "06", "juil.": "07", "août": "08", "sept.": "09", "oct.": "10", "nov.": "11", "déc.": "12" };
                    var parts = d.replace(/\./g, '').toLowerCase().split(" "); 
                    if (parts.length === 3) {
                        var day = parts[0].padStart(2, '0');
                        var month = frMonths[parts[1]];
                        var year = parts[2];
                        if (day && month && year) {
                            return parseInt(year + month + day, 10);
                        }
                    }
                    return 0; 
                },
                "date-fr-asc": function (a, b) { return a - b; },
                "date-fr-desc": function (a, b) { return b - a; }
            });
            $.fn.dataTable.ext.type.detect.unshift(function(d) {
                 if (typeof d === 'string' && d.match(/^\d{1,2} [a-zûéç.]+(?:\.)? \d{4}$/i)) { 
                    return 'date-fr';
                }
                return null;
            });
        }

        $('#contractsTable tbody').off('click', 'td.details-control button.show-details-btn').on('click', 'td.details-control button.show-details-btn', function () { 
            var tr = $(this).closest('tr');
            var row = appState.dataTable.row(tr); 
            var buttonIcon = $(this).find('i');
            var $button = $(this);

            if (row.child.isShown()) {
                $('div.detail-content-wrapper', row.child()).slideUp(function() {
                    row.child.hide();
                    tr.removeClass('shown'); 
                    buttonIcon.removeClass('fa-minus-circle shown').addClass('fa-plus-circle');
                    $button.attr('aria-label', 'Masquer les détails').attr('aria-expanded', 'false');
                });
            } else {
                row.child(formatDetailRowAdeme(row.data()), 'detail-row').show(); 
                tr.addClass('shown');
                buttonIcon.removeClass('fa-plus-circle').addClass('fa-minus-circle shown');
                $button.attr('aria-label', 'Masquer les détails').attr('aria-expanded', 'true');
                $('div.detail-content-wrapper', row.child()).slideDown();
            }
        });
    }
    
    function formatDetailRowAdeme(d) { /* ... (unchanged) ... */ 
        return `<div class="detail-content-wrapper" style="display:none;">
            <div class="detail-grid">
                <div class="detail-item">
                    <strong>Référence Décision/ID:</strong> 
                    <div>${_.escape(d._id)}</div>
                </div>
                <div class="detail-item">
                    <strong>ID Bénéficiaire:</strong> 
                    <div>${_.escape(d._idBeneficiaire)}</div>
                </div>
                <div class="detail-item full-width">
                    <strong>Objet Complet:</strong> 
                    <div class="object-detail">${_.escape(d._objetComplet)}</div>
                </div>
                <div class="detail-item">
                    <strong>Bénéficiaire (complet):</strong> 
                    <div>${_.escape(d._nomBeneficiaireComplet)}</div>
                </div>
                <div class="detail-item">
                    <strong>Dispositif d'Aide (complet):</strong> 
                    <div>${_.escape(d._dispositifAideComplet)}</div>
                </div>
                <div class="detail-item">
                    <strong>Nature de l'Aide:</strong> 
                    <div>${_.escape(d._natureAide)}</div>
                </div>
                <div class="detail-item">
                    <strong>Conditions Versement:</strong> 
                    <div>${_.escape(d._conditionsVersement)}</div>
                </div>
                <div class="detail-item">
                    <strong>Dates Période Versement:</strong> 
                    <div>${_.escape(d._datesPeriodeVersement)}</div>
                </div>
                <div class="detail-item">
                    <strong>Notification UE:</strong> 
                    <div>${_.escape(d._notificationUE)}</div>
                </div>
                <div class="detail-item">
                    <strong>Date Convention (brute):</strong> 
                    <div>${_.escape(d._dateNotificationRaw)}</div>
                </div>
            </div>
        </div>`;
    }
    function updateChartsAdeme() { /* ... (unchanged from previous) ... */ 
        const data = appState.filteredData;
        const chartColors = [
            '#3498DB', '#2ECC71', '#E74C3C', '#F1C40F', '#9B59B6', 
            '#34495E', '#1ABC9C', '#E67E22', '#8E44AD', '#27AE60'
        ];

        const amountRanges = [0, 1000, 5000, 10000, 25000, 50000, 100000, 500000, Infinity];
        const amountLabels = ['<1k €', '1-5k €', '5-10k €', '10-25k €', '25-50k €', '50-100k €', '100-500k €', '>500k €'];
        const amountCounts = Array(amountLabels.length).fill(0);
        if(data.length > 0) {
            data.forEach(item => {
                for (let i = 0; i < amountRanges.length - 1; i++) {
                    if (item.montant >= amountRanges[i] && item.montant < amountRanges[i+1]) {
                        amountCounts[i]++;
                        break;
                    }
                }
            });
        }
        renderChart('amountDistributionChart', 'bar', amountLabels, 
            [{ label: 'Nombre d\'Aides', data: amountCounts, backgroundColor: chartColors[0], borderWidth: 1 }]
        );

        const timelineData = data.length > 0 ? _.groupBy(data, 'annee') : {};
        const years = Object.keys(timelineData).filter(y => y !== 'null' && y !== 'undefined').sort((a,b) => parseInt(a) - parseInt(b));
        const contractCountsByYear = years.map(year => timelineData[year].length);
        const totalAmountByYear = years.map(year => timelineData[year].reduce((sum, item) => sum + item.montant, 0));
        renderChart('timelineChart', 'line', years, [
            { label: 'Nombre d\'Aides', data: contractCountsByYear, borderColor: chartColors[0], backgroundColor: chartColors[0] + '33', tension: 0.1, fill: true, yAxisID: 'yContracts' },
            { label: 'Montant Total (€)', data: totalAmountByYear, borderColor: chartColors[1], backgroundColor: chartColors[1] + '33', tension: 0.1, fill: true, yAxisID: 'yAmount' }
        ], { 
            scales: { 
                yContracts: { type: 'linear', position: 'left', title: {display: true, text: 'Nombre d\'Aides'}, beginAtZero: true }, 
                yAmount: { type: 'linear', position: 'right', title: {display: true, text: 'Montant Total (€)'}, grid: {drawOnChartArea: false}, ticks: {callback: (v) => formatCurrency(v)}, beginAtZero: true }
            }
        });

        const dispositifCounts = data.length > 0 ? _.countBy(data, d => d.dispositifAide === 'Non spécifié' ? 'Autre/Non Spécifié' : d.dispositifAide) : {};
        const topDispositifs = _.take(_.orderBy(_.toPairs(dispositifCounts), 1, 'desc'), 10);
        renderChart('topProceduresChart', 'pie', topDispositifs.map(p => p[0]), 
            [{ data: topDispositifs.map(p => p[1]), backgroundColor: chartColors, borderWidth: 1 }]
        );
        
        const beneficiaireAmounts = {};
        if (data.length > 0) {
            data.forEach(item => {
                const key = item.nomBeneficiaire === 'Non spécifié' ? 'Autre/Non Spécifié' : item.nomBeneficiaire;
                beneficiaireAmounts[key] = (beneficiaireAmounts[key] || 0) + item.montant;
            });
        }
        const topBeneficiaires = _.take(_.orderBy(_.toPairs(beneficiaireAmounts), 1, 'desc'), 10);
        renderChart('topBuyersChart', 'bar', topBeneficiaires.map(b => b[0]), 
            [{ label: 'Montant Total Reçu', data: topBeneficiaires.map(b => b[1]), backgroundColor: chartColors[2], borderWidth: 1 }], 
            { indexAxis: 'y', scales: {x: {ticks: {callback: (v) => formatCurrency(v)}, beginAtZero: true}} }
        );
        
        const conditionsVersementCounts = data.length > 0 ? _.countBy(data, d => d.conditionsVersement === 'Non spécifié' ? 'Autre/Non Spécifié' : d.conditionsVersement) : {};
        const conditionsLabels = Object.keys(conditionsVersementCounts);
        const conditionsData = conditionsLabels.map(label => conditionsVersementCounts[label]);
        renderChart('beneficiaryTypeChart', 'doughnut', conditionsLabels, 
            [{ data: conditionsData, backgroundColor: chartColors, borderWidth: 1 }]
        );
        
        const notificationUECounts = data.length > 0 ? _.countBy(data, d => d.notificationUE === 'N/A' ? 'Non Renseigné' : d.notificationUE) : {};
        const notifLabels = Object.keys(notificationUECounts);
        const notifData = notifLabels.map(label => notificationUECounts[label]);
        renderChart('geoDistributionChart', 'pie', notifLabels, 
            [{ data: notifData, backgroundColor: [chartColors[3], chartColors[4], chartColors[5]], borderWidth: 1 }] 
        );
    }
    function renderChart(canvasId, type, labels, datasets, customOptions = {}) { /* ... (unchanged) ... */ 
        const ctx = document.getElementById(canvasId);
        if (!ctx) {
            console.warn(`Canvas element with ID ${canvasId} not found.`);
            return;
        }
        if (appState.charts[canvasId]) {
            appState.charts[canvasId].destroy();
        }
        
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false, 
            plugins: {
                legend: { 
                    position: (type === 'pie' || type === 'doughnut') ? 'bottom' : 'top',
                    labels: { usePointStyle: true, pointStyle: 'rectRounded' }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || context.label || ''; 
                            if (label) label += ': ';
                            
                            let value;
                            if (context.formattedValue) { 
                                value = context.formattedValue;
                            } else if (context.parsed && context.parsed.y !== undefined) { 
                                value = context.parsed.y;
                            } else if (context.parsed !== undefined) { 
                                value = context.parsed;
                            } else {
                                value = 0;
                            }

                            if (typeof value === 'number') {
                                if (context.dataset.yAxisID === 'yAmount' || (context.dataset.label && context.dataset.label.toLowerCase().includes('montant')) || type === 'bar' && customOptions.indexAxis === 'y' ) {
                                    label += formatCurrency(value);
                                } else {
                                    label += formatNumber(value);
                                }
                            } else {
                                label += value; 
                            }

                            if ((type === 'pie' || type === 'doughnut') && typeof context.parsed === 'number') {
                                const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                                const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) + '%' : '0%';
                                label += ` (${percentage})`;
                            }
                            return label;
                        }
                    }
                }
            },
        };

        appState.charts[canvasId] = new Chart(ctx, {
            type: type,
            data: { labels: labels, datasets: datasets },
            options: _.merge({}, defaultOptions, customOptions) 
        });
    }
    function updateFilterMetrics() { /* ... (unchanged) ... */ 
        const data = appState.filteredData;
        const container = $('#filterMetricsDisplay');
        
        const noActiveFilters = Object.values(appState.currentFilters).every(val => 
            !val || (typeof val === 'number' && val === 0) || (typeof val === 'number' && val === Infinity)
        ) && !appState.currentFilters.globalSearchTerm;


        if ((data.length === appState.rawData.length && noActiveFilters) || appState.rawData.length === 0) {
            container.hide();
            return;
        }

        const totalAmountFiltered = data.reduce((sum, item) => sum + item.montant, 0);
        const avgAmountFiltered = data.length ? totalAmountFiltered / data.length : 0;
        
        container.html(`
            <div class="filter-header">Statistiques des Données Filtrées</div>
            <div class="metric-item">
                <div class="metric-number">${formatNumber(data.length)}</div>
                <div class="metric-label">Aides Filtrées</div>
            </div>
            <div class="metric-item">
                <div class="metric-number">${formatCurrency(totalAmountFiltered)}</div>
                <div class="metric-label">Montant Total Filtré</div>
            </div>
            <div class="metric-item">
                <div class="metric-number">${formatCurrency(avgAmountFiltered)}</div>
                <div class="metric-label">Montant Moyen Filtré</div>
            </div>
        `).show();
    }
    function updateFooterMetrics() { /* ... (unchanged) ... */ 
        let dataToSummarize = appState.filteredData; 
        const container = $('#footerMetricsDisplay');

        if (dataToSummarize.length === 0) {
            container.hide();
            return;
        }

        const totalVisibleAmount = dataToSummarize.reduce((sum, item) => sum + item.montant, 0);
        const amounts = dataToSummarize.map(d => d.montant);
        const minVisibleAmount = amounts.length > 0 ? _.min(amounts) : 0;
        const maxVisibleAmount = amounts.length > 0 ? _.max(amounts) : 0;

        container.html(`
            <div class="metric-item">
                <div class="metric-number">${formatNumber(dataToSummarize.length)}</div>
                <div class="metric-label">Aides (Selon Filtres Actuels)</div>
            </div>
            <div class="metric-item">
                <div class="metric-number">${formatCurrency(totalVisibleAmount)}</div>
                <div class="metric-label">Montant Total (Filtres)</div>
            </div>
            <div class="metric-item">
                <div class="metric-number">${formatCurrency(minVisibleAmount)}</div>
                <div class="metric-label">Plus Petite Aide (Filtres)</div>
            </div>
            <div class="metric-item">
                <div class="metric-number">${formatCurrency(maxVisibleAmount)}</div>
                <div class="metric-label">Plus Grande Aide (Filtres)</div>
            </div>
        `).show();
    }
    function showNotification(message, type = 'info') { /* ... (unchanged from previous) ... */ 
        const notificationArea = $('#notificationArea'); 
        if (notificationArea.length === 0) {
            console.error("Notification area not found in HTML.");
            return;
        }
        
        let bgColor = 'var(--primary-color)'; 
        let textColor = 'var(--accent1)'; 

        switch(type) {
            case 'success':
                bgColor = 'var(--completed-color, #2ECC71)'; 
                textColor = 'var(--text-light, #fff)';
                break;
            case 'error':
                bgColor = 'var(--secondary-color, #EF4135)'; 
                textColor = 'var(--text-light, #fff)';
                break;
            case 'warning':
                bgColor = 'var(--planning-color, #F1C40F)'; 
                textColor = 'var(--text-dark, #212529)'; 
                break;
            default: 
                 bgColor = 'var(--primary-color, #0055A4)';
                 textColor = 'var(--text-light, #fff)';
        }

        notificationArea
            .text(message)
            .css({
                'background-color': bgColor,
                'color': textColor,
                'opacity': 1, 
                'display': 'block' 
            })
            .stop(true, true) 
            .fadeIn(300).delay(4000).fadeOut(500);
        
        console.log(`Notification [${type}]: ${message}`);
    }

})();
