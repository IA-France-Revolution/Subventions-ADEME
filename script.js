// État de l'application
const appState = {
    rawData: null,
    filteredData: null,
    charts: {},
    tables: {},
    filters: {
        year: null,
        dispositif: null,
        minAmount: null,
        maxAmount: null
    },
    dataReady: false
};

// Vérifier que les dépendances sont disponibles
function checkDependencies() {
    if (!window.jQuery) {
        console.error("jQuery n'est pas chargé. Certaines fonctionnalités pourraient ne pas fonctionner.");
        return false;
    }
    if (!$.fn.DataTable) {
        console.error("DataTables n'est pas chargé. Les tableaux interactifs ne fonctionneront pas.");
        return false;
    }
    if (!window.Chart) {
        console.error("Chart.js n'est pas chargé. Les graphiques ne fonctionneront pas.");
        return false;
    }
    return true;
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    // Masquer le dashboard au chargement
    hideElement('#dashboard');
    hideElement('#filterSection');
    
    // Vérifier les dépendances
    const dependenciesLoaded = checkDependencies();
    
    // Ajouter les écouteurs d'événements
    document.getElementById('processButton').addEventListener('click', processCSV);
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
    document.getElementById('exportCsv').addEventListener('click', () => exportData('csv'));
    document.getElementById('exportExcel').addEventListener('click', () => exportData('excel'));
    document.getElementById('exportPdf').addEventListener('click', () => exportData('pdf'));
    
    // Ajouter un écouteur pour afficher le nom du fichier sélectionné
    document.getElementById('csvFileInput').addEventListener('change', updateFileLabel);
    
    // Masquer le loader après initialisation
    setTimeout(() => {
        const loader = document.getElementById('pageLoader');
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 500);
    }, 1000);
});

// Mettre à jour le label du fichier sélectionné
function updateFileLabel(event) {
    const fileInput = event.target;
    const fileLabel = document.querySelector('.custom-file-label');
    const fileInfo = document.getElementById('fileInfo');
    
    if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        fileLabel.textContent = file.name;
        
        // Afficher les informations du fichier
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = formatFileSize(file.size);
        document.getElementById('fileType').textContent = file.type || 'text/csv';
        
        showElement('#fileInfo');
    } else {
        fileLabel.textContent = 'Choisir un fichier';
        hideElement('#fileInfo');
    }
}

// Formatter la taille du fichier
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Traiter le fichier CSV
function processCSV() {
    const fileInput = document.getElementById('csvFileInput');
    const statusDiv = document.getElementById('uploadStatus');
    const progressBar = document.querySelector('#uploadProgress .progress-bar');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        showNotification('Veuillez sélectionner un fichier CSV', 'error');
        statusDiv.innerHTML = '<div class="alert alert-danger">Veuillez sélectionner un fichier CSV</div>';
        return;
    }
    
    const file = fileInput.files[0];
    statusDiv.innerHTML = '<div class="alert alert-info">Traitement en cours...</div>';
    showElement('#uploadProgress');
    progressBar.style.width = '0%';
    
    // Simuler une progression
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 5;
        if (progress <= 90) {
            progressBar.style.width = progress + '%';
        }
    }, 150);
    
    const reader = new FileReader();
    
    reader.onload = function(event) {
        try {
            // Analyser le CSV avec PapaParse
            Papa.parse(event.target.result, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true,
                encoding: "UTF-8",
                complete: function(results) {
                    clearInterval(progressInterval);
                    progressBar.style.width = '100%';
                    
                    if (results.errors.length > 0) {
                        showNotification('Erreur lors du traitement du fichier', 'error');
                        statusDiv.innerHTML = `<div class="alert alert-danger">Erreur: ${results.errors[0].message}</div>`;
                        return;
                    }
                    
                    // Normaliser les données
                    const normalizedData = normalizeData(results.data);
                    appState.rawData = normalizedData;
                    appState.filteredData = normalizedData;
                    appState.dataReady = true;
                    
                    // Initialiser les filtres
                    initializeFilters(normalizedData);
                    
                    // Traiter les données
                    processData(normalizedData);
                    
                    // Masquer la barre de progression après un court délai
                    setTimeout(() => {
                        hideElement('#uploadProgress');
                    }, 500);
                    
                    showNotification(`${normalizedData.length} enregistrements chargés avec succès!`, 'success');
                    statusDiv.innerHTML = `<div class="alert alert-success">Succès! ${normalizedData.length} enregistrements chargés.</div>`;
                    
                    // Afficher le dashboard et la section de filtres
                    showElement('#dashboard');
                    showElement('#filterSection');
                },
                error: function(error) {
                    clearInterval(progressInterval);
                    hideElement('#uploadProgress');
                    showNotification('Erreur lors du traitement du fichier', 'error');
                    statusDiv.innerHTML = `<div class="alert alert-danger">Erreur: ${error.message}</div>`;
                }
            });
        } catch (error) {
            clearInterval(progressInterval);
            hideElement('#uploadProgress');
            showNotification('Erreur lors du traitement du fichier', 'error');
            statusDiv.innerHTML = `<div class="alert alert-danger">Erreur: ${error.message}</div>`;
        }
    };
    
    reader.onerror = function() {
        clearInterval(progressInterval);
        hideElement('#uploadProgress');
        showNotification('Erreur lors de la lecture du fichier', 'error');
        statusDiv.innerHTML = '<div class="alert alert-danger">Erreur lors de la lecture du fichier</div>';
    };
    
    reader.readAsText(file);
}

// Normaliser les données pour s'assurer que toutes les propriétés sont présentes et correctes
function normalizeData(data) {
    return data.map(item => {
        // Standardiser les noms de colonnes et s'assurer que toutes les propriétés sont présentes
        const normalizedItem = {
            nomBeneficiaire: getString(item.nomBeneficiaire || item['Nom du bénéficiaire'] || item['nom_beneficiaire'] || ''),
            dispositifAide: getString(item.dispositifAide || item['Dispositif d\'aide'] || item['dispositif_aide'] || ''),
            dateConvention: getString(item.dateConvention || item['Date de la convention'] || item['date_convention'] || ''),
            montant: getNumber(item.montant || item['Montant'] || item['montant'] || 0),
            conditionsVersement: getString(item.conditionsVersement || item['Conditions de versement'] || item['conditions_versement'] || ''),
            notificationUE: getString(item.notificationUE || item['Notification UE'] || item['notification_ue'] || ''),
            typeBeneficiaire: getString(item.typeBeneficiaire || item['Type de bénéficiaire'] || item['type_beneficiaire'] || '')
        };
        
        // Extraire l'année de la date de convention
        if (normalizedItem.dateConvention) {
            try {
                normalizedItem.annee = parseInt(normalizedItem.dateConvention.substring(0, 4));
            } catch (e) {
                normalizedItem.annee = null;
            }
        }
        
        return normalizedItem;
    }).filter(item => {
        // Filtrer les lignes sans bénéficiaire ou sans montant
        return item.nomBeneficiaire && item.montant !== null && !isNaN(item.montant);
    });
}

// Initialiser les filtres avec les valeurs uniques des données
function initializeFilters(data) {
    // Années uniques
    const anneeFilter = document.getElementById('anneeFilter');
    const annees = [...new Set(data.map(item => item.annee).filter(Boolean))].sort();
    
    // Vider les options existantes
    anneeFilter.innerHTML = '<option value="">Toutes les années</option>';
    
    // Ajouter les nouvelles options
    annees.forEach(annee => {
        const option = document.createElement('option');
        option.value = annee;
        option.textContent = annee;
        anneeFilter.appendChild(option);
    });
    
    // Dispositifs uniques
    const dispositifFilter = document.getElementById('dispositifFilter');
    const dispositifs = [...new Set(data.map(item => item.dispositifAide).filter(Boolean))].sort();
    
    // Vider les options existantes
    dispositifFilter.innerHTML = '<option value="">Tous les dispositifs</option>';
    
    // Ajouter les nouvelles options (limitées à 20 pour éviter une liste trop longue)
    dispositifs.slice(0, 20).forEach(dispositif => {
        const option = document.createElement('option');
        option.value = dispositif;
        option.textContent = dispositif.length > 50 ? dispositif.substring(0, 50) + '...' : dispositif;
        dispositifFilter.appendChild(option);
    });
    
    // Initialiser les valeurs min/max des montants
    const montants = data.map(item => item.montant).filter(Boolean);
    const minMontant = Math.min(...montants);
    const maxMontant = Math.max(...montants);
    
    document.getElementById('minAmount').placeholder = Math.floor(minMontant).toString();
    document.getElementById('maxAmount').placeholder = Math.ceil(maxMontant).toString();
}

// Appliquer les filtres
function applyFilters() {
    if (!appState.rawData) return;
    
    // Récupérer les valeurs des filtres
    const annee = document.getElementById('anneeFilter').value;
    const dispositif = document.getElementById('dispositifFilter').value;
    const minAmount = document.getElementById('minAmount').value;
    const maxAmount = document.getElementById('maxAmount').value;
    
    // Mettre à jour l'état des filtres
    appState.filters = {
        year: annee ? parseInt(annee) : null,
        dispositif: dispositif || null,
        minAmount: minAmount ? parseFloat(minAmount) : null,
        maxAmount: maxAmount ? parseFloat(maxAmount) : null
    };
    
    // Filtrer les données
    appState.filteredData = appState.rawData.filter(item => {
        // Filtre par année
        if (appState.filters.year && item.annee !== appState.filters.year) {
            return false;
        }
        
        // Filtre par dispositif
        if (appState.filters.dispositif && item.dispositifAide !== appState.filters.dispositif) {
            return false;
        }
        
        // Filtre par montant minimum
        if (appState.filters.minAmount !== null && item.montant < appState.filters.minAmount) {
            return false;
        }
        
        // Filtre par montant maximum
        if (appState.filters.maxAmount !== null && item.montant > appState.filters.maxAmount) {
            return false;
        }
        
        return true;
    });
    
    // Mettre à jour les visualisations
    processData(appState.filteredData);
    
    // Afficher une notification
    showNotification(`Filtres appliqués: ${appState.filteredData.length} résultats trouvés`, 'info');
}

// Réinitialiser les filtres
function resetFilters() {
    // Réinitialiser les valeurs des filtres dans le formulaire
    document.getElementById('anneeFilter').value = '';
    document.getElementById('dispositifFilter').value = '';
    document.getElementById('minAmount').value = '';
    document.getElementById('maxAmount').value = '';
    
    // Réinitialiser les filtres dans l'état
    appState.filters = {
        year: null,
        dispositif: null,
        minAmount: null,
        maxAmount: null
    };
    
    // Réinitialiser les données filtrées
    appState.filteredData = appState.rawData;
    
    // Mettre à jour les visualisations
    processData(appState.rawData);
    
    // Afficher une notification
    showNotification('Filtres réinitialisés', 'info');
}

// Traiter les données et mettre à jour toutes les visualisations
function processData(data) {
    // Mettre à jour les statistiques
    updateStatistics(data);
    
    // Initialiser ou mettre à jour le tableau de données principales
    initializeMainDataTable(data);
    
    // Créer ou mettre à jour les graphiques
    createAmountDistributionChart(data);
    createTimelineChart(data);
    createTopDevicesChart(data);
    createPaymentConditionsChart(data);
    createEUNotificationChart(data);
    createTopBeneficiariesTable(data);
    createBeneficiaryTypeChart(data);
}

// Mettre à jour les statistiques
function updateStatistics(data) {
    const totalProjects = data.length;
    
    // Calculer le montant total
    let totalAmount = 0;
    let validAmounts = [];
    
    data.forEach(item => {
        if (item.montant && !isNaN(item.montant)) {
            totalAmount += item.montant;
            validAmounts.push(item.montant);
        }
    });
    
    // Calculer le montant médian
    validAmounts.sort((a, b) => a - b);
    const medianAmount = validAmounts.length % 2 === 0 
        ? (validAmounts[validAmounts.length / 2 - 1] + validAmounts[validAmounts.length / 2]) / 2
        : validAmounts[Math.floor(validAmounts.length / 2)];
    
    // Calculer le montant moyen
    const avgAmount = totalAmount / validAmounts.length;
    
    // Mettre à jour les cartes de statistiques
    document.getElementById('totalProjects').textContent = totalProjects.toLocaleString();
    document.getElementById('totalAmount').textContent = formatCurrency(totalAmount, true);
    document.getElementById('avgAmount').textContent = formatCurrency(avgAmount);
    document.getElementById('medianAmount').textContent = formatCurrency(medianAmount);
}

// Initialiser le tableau de données principales
function initializeMainDataTable(data) {
    const tableId = 'mainDataTable';
    
    // Si le tableau existe déjà, le détruire
    if (appState.tables[tableId]) {
        appState.tables[tableId].destroy();
    }
    
    // Formater les données pour le tableau
    const tableData = data.map(item => [
        item.nomBeneficiaire,
        item.dispositifAide,
        formatDate(item.dateConvention),
        formatCurrency(item.montant),
        item.conditionsVersement,
        item.notificationUE
    ]);
    
    // S'assurer que jQuery est disponible avant d'initialiser DataTables
    if (window.jQuery && $.fn.DataTable) {
        // Initialiser le tableau
        appState.tables[tableId] = $('#' + tableId).DataTable({
            data: tableData,
            columns: [
                { title: 'Bénéficiaire' },
                { title: 'Dispositif d\'Aide' },
                { title: 'Date' },
                { title: 'Montant (€)' },
                { title: 'Conditions' },
                { title: 'Notification UE' }
            ],
            responsive: true,
            ordering: true,
            searching: true,
            paging: true,
            pageLength: 10,
            lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "Tous"]],
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.10.21/i18n/French.json'
            },
            dom: 'Bfrtip',
            buttons: [
                'copy', 'csv', 'excel', 'pdf', 'print'
            ],
            initComplete: function() {
                $('.dataTables_wrapper').addClass('pb-3');
            }
        });
    } else {
        console.error("jQuery ou DataTables n'est pas disponible");
        // Fallback pour afficher les données sans DataTables
        const table = document.getElementById(tableId);
        if (table) {
            const tbody = table.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = '';
                tableData.forEach(row => {
                    const tr = document.createElement('tr');
                    row.forEach(cell => {
                        const td = document.createElement('td');
                        td.textContent = cell || '';
                        tr.appendChild(td);
                    });
                    tbody.appendChild(tr);
                });
            }
        }
    }
}

// Créer ou mettre à jour le graphique de distribution des montants
function createAmountDistributionChart(data) {
    // Définir les plages de montants
    const ranges = [
        { label: '<10k€', min: 0, max: 10000 },
        { label: '10k-50k€', min: 10000, max: 50000 },
        { label: '50k-100k€', min: 50000, max: 100000 },
        { label: '100k-500k€', min: 100000, max: 500000 },
        { label: '500k-1M€', min: 500000, max: 1000000 },
        { label: '1M-5M€', min: 1000000, max: 5000000 },
        { label: '>5M€', min: 5000000, max: Infinity }
    ];
    
    // Compter les projets dans chaque plage
    const rangeCounts = ranges.map(range => {
        return data.filter(item => {
            return item.montant >= range.min && item.montant < range.max;
        }).length;
    });
    
    const ctx = document.getElementById('amountDistributionChart').getContext('2d');
    
    // Détruire le graphique existant s'il existe
    if (appState.charts.amountDistribution) {
        appState.charts.amountDistribution.destroy();
    }
    
    // Générer des couleurs de gradient pour les barres
    const gradients = ranges.map((_, index) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        const intensity = 1 - (index / (ranges.length - 1)) * 0.6;
        gradient.addColorStop(0, `rgba(0, 161, 118, ${intensity})`);
        gradient.addColorStop(1, `rgba(0, 161, 118, ${intensity * 0.5})`);
        return gradient;
    });
    
    // Créer un nouveau graphique
    appState.charts.amountDistribution = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ranges.map(r => r.label),
            datasets: [{
                label: 'Nombre de Projets',
                data: rangeCounts,
                backgroundColor: gradients,
                borderColor: '#007257',
                borderWidth: 1,
                borderRadius: 6,
                maxBarThickness: 60
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 12,
                            family: 'var(--font-main)'
                        },
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 12,
                    cornerRadius: 6,
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const percent = (value / data.length * 100).toFixed(1);
                            return `${value.toLocaleString()} projets (${percent}%)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    },
                    border: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12
                        },
                        padding: 10,
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    },
                    title: {
                        display: true,
                        text: 'Nombre de Projets',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: {
                            top: 10,
                            bottom: 10
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12
                        },
                        padding: 8
                    },
                    title: {
                        display: true,
                        text: 'Montant de l\'Aide',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: {
                            top: 10,
                            bottom: 0
                        }
                    }
                }
            },
            layout: {
                padding: {
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Créer ou mettre à jour le graphique d'évolution temporelle
function createTimelineChart(data) {
    // Traiter les dates pour extraire les années
    const datesByYear = {};
    const amountsByYear = {};
    
    data.forEach(item => {
        if (item.annee) {
            const year = item.annee;
            datesByYear[year] = (datesByYear[year] || 0) + 1;
            amountsByYear[year] = (amountsByYear[year] || 0) + (item.montant || 0);
        }
    });
    
    // Trier les années
    const sortedYears = Object.keys(datesByYear).sort();
    const yearCounts = sortedYears.map(year => datesByYear[year]);
    const yearAmounts = sortedYears.map(year => amountsByYear[year] / 1000000); // Convertir en millions
    
    const ctx = document.getElementById('timelineChart').getContext('2d');
    
    // Détruire le graphique existant s'il existe
    if (appState.charts.timeline) {
        appState.charts.timeline.destroy();
    }
    
    // Créer un nouveau graphique
    appState.charts.timeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedYears,
            datasets: [
                {
                    label: 'Nombre d\'Aides',
                    data: yearCounts,
                    borderColor: '#00a176',
                    backgroundColor: 'rgba(0, 161, 118, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Montant Total (M€)',
                    data: yearAmounts,
                    borderColor: '#007257',
                    backgroundColor: 'rgba(0, 114, 87, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Nombre d\'Aides'
                    }
                },
                y1: {
                    beginAtZero: true,
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false,
                    },
                    title: {
                        display: true,
                        text: 'Montant Total (M€)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Année'
                    }
                }
            }
        }
    });
}

// Créer ou mettre à jour le graphique des top dispositifs
function createTopDevicesChart(data) {
    // Compter les occurrences de chaque dispositif
    const deviceCounts = {};
    
    data.forEach(item => {
        if (item.dispositifAide) {
            // S'assurer que dispositifAide est une chaîne avant d'appeler trim
            const trimmedDevice = typeof item.dispositifAide === 'string' ? 
                item.dispositifAide.trim() : 
                String(item.dispositifAide);
            deviceCounts[trimmedDevice] = (deviceCounts[trimmedDevice] || 0) + 1;
        }
    });
    
    // Trier et obtenir le top 10
    const sortedDevices = Object.entries(deviceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const deviceNames = sortedDevices.map(d => d[0].length > 40 ? d[0].substring(0, 40) + '...' : d[0]);
    const deviceValues = sortedDevices.map(d => d[1]);
    
    const ctx = document.getElementById('topDevicesChart').getContext('2d');
    
    // Détruire le graphique existant s'il existe
    if (appState.charts.topDevices) {
        appState.charts.topDevices.destroy();
    }
    
    // Créer un nouveau graphique
    appState.charts.topDevices = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: deviceNames,
            datasets: [{
                label: 'Nombre de Projets',
                data: deviceValues,
                backgroundColor: '#00a176',
                borderColor: '#007257',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const percent = (value / data.length * 100).toFixed(1);
                            return `${value} projets (${percent}%)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Nombre de Projets'
                    }
                }
            }
        }
    });
}

// Créer ou mettre à jour le graphique des conditions de paiement
function createPaymentConditionsChart(data) {
    // Compter chaque condition de paiement
    const conditionCounts = {};
    
    data.forEach(item => {
        if (item.conditionsVersement) {
            // S'assurer que conditionsVersement est une chaîne avant d'appeler trim
            const condition = typeof item.conditionsVersement === 'string' ? 
                item.conditionsVersement.trim() : 
                String(item.conditionsVersement);
            conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
        } else {
            conditionCounts['Non spécifié'] = (conditionCounts['Non spécifié'] || 0) + 1;
        }
    });
    
    // Préparer les données pour le graphique
    const conditions = Object.keys(conditionCounts);
    const counts = conditions.map(c => conditionCounts[c]);
    
    // Préparer les couleurs (palette de verts)
    const colors = generateColorGradient('#00a176', '#e6f7f2', conditions.length);
    
    const ctx = document.getElementById('paymentConditionsChart').getContext('2d');
    
    // Détruire le graphique existant s'il existe
    if (appState.charts.paymentConditions) {
        appState.charts.paymentConditions.destroy();
    }
    
    // Créer un nouveau graphique
    appState.charts.paymentConditions = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: conditions,
            datasets: [{
                data: counts,
                backgroundColor: colors,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const percent = (value / data.length * 100).toFixed(1);
                            return `${value} projets (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Créer ou mettre à jour le graphique de notification UE
function createEUNotificationChart(data) {
    // Compter chaque statut de notification UE
    const notificationCounts = {};
    
    data.forEach(item => {
        if (item.notificationUE) {
            // S'assurer que notificationUE est une chaîne avant d'appeler trim
            const status = typeof item.notificationUE === 'string' ? 
                item.notificationUE.trim() : 
                String(item.notificationUE);
            notificationCounts[status] = (notificationCounts[status] || 0) + 1;
        } else {
            notificationCounts['Non spécifié'] = (notificationCounts['Non spécifié'] || 0) + 1;
        }
    });
    
    const statuses = Object.keys(notificationCounts);
    const counts = statuses.map(s => notificationCounts[s]);
    
    // Préparer les couleurs
    const colors = ['#007257', '#00a176', '#40c4aa', '#e6f7f2'];
    
    const ctx = document.getElementById('euNotificationChart').getContext('2d');
    
    // Détruire le graphique existant s'il existe
    if (appState.charts.euNotification) {
        appState.charts.euNotification.destroy();
    }
    
    // Créer un nouveau graphique
    appState.charts.euNotification = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: statuses,
            datasets: [{
                data: counts,
                backgroundColor: colors.slice(0, statuses.length),
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const percent = (value / data.length * 100).toFixed(1);
                            return `${value} projets (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Créer ou mettre à jour le tableau des top bénéficiaires
function createTopBeneficiariesTable(data) {
    // Grouper par bénéficiaire
    const beneficiaries = {};
    
    data.forEach(item => {
        if (item.nomBeneficiaire && item.montant) {
            // S'assurer que nomBeneficiaire est une chaîne avant d'appeler trim
            const name = typeof item.nomBeneficiaire === 'string' ? 
                item.nomBeneficiaire.trim() : 
                String(item.nomBeneficiaire);
            
            if (!beneficiaries[name]) {
                beneficiaries[name] = {
                    count: 0,
                    totalAmount: 0
                };
            }
            
            beneficiaries[name].count += 1;
            beneficiaries[name].totalAmount += (item.montant || 0);
        }
    });
    
    // Calculer la moyenne et trier
    Object.keys(beneficiaries).forEach(name => {
        beneficiaries[name].avgAmount = beneficiaries[name].totalAmount / beneficiaries[name].count;
    });
    
    const sortedBeneficiaries = Object.entries(beneficiaries)
        .sort((a, b) => b[1].totalAmount - a[1].totalAmount)
        .slice(0, 10)
        .map(([name, stats]) => ({
            name: name,
            count: stats.count,
            totalAmount: stats.totalAmount,
            avgAmount: stats.avgAmount
        }));
    
    const tableId = 'topBeneficiariesTable';
    
    // Si le tableau existe déjà, le détruire
    if (appState.tables[tableId]) {
        appState.tables[tableId].destroy();
    }
    
    // Préparer les données pour le tableau
    const tableData = sortedBeneficiaries.map(beneficiary => [
        beneficiary.name,
        beneficiary.count,
        formatCurrency(beneficiary.totalAmount),
        formatCurrency(beneficiary.avgAmount)
    ]);
    
    // S'assurer que jQuery est disponible avant d'initialiser DataTables
    if (window.jQuery && $.fn.DataTable) {
        // Initialiser le tableau avec DataTables
        appState.tables[tableId] = $('#' + tableId).DataTable({
            data: tableData,
            columns: [
                { title: 'Bénéficiaire' },
                { title: 'Nombre d\'Aides' },
                { title: 'Montant Total' },
                { title: 'Montant Moyen' }
            ],
            paging: false,
            searching: false,
            info: false,
            responsive: true,
            ordering: true,
            order: [[2, 'desc']]
        });
    } else {
        console.error("jQuery ou DataTables n'est pas disponible");
        // Fallback pour afficher les données sans DataTables
        const table = document.getElementById(tableId);
        if (table) {
            const tbody = table.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = '';
                tableData.forEach(row => {
                    const tr = document.createElement('tr');
                    row.forEach(cell => {
                        const td = document.createElement('td');
                        td.textContent = cell || '';
                        tr.appendChild(td);
                    });
                    tbody.appendChild(tr);
                });
            }
        }
    }
}

// Créer ou mettre à jour le graphique du type de bénéficiaire
function createBeneficiaryTypeChart(data) {
    // Compter chaque type de bénéficiaire
    const typeCounts = {};
    
    data.forEach(item => {
        let type = 'Non spécifié';
        
        if (item.typeBeneficiaire) {
            type = typeof item.typeBeneficiaire === 'string' ? 
                item.typeBeneficiaire.trim() : 
                String(item.typeBeneficiaire);
        }
        
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    // Si le type est vide, essayer de déduire à partir du nom
    if (Object.keys(typeCounts).length <= 1) {
        // Réinitialiser les compteurs
        Object.keys(typeCounts).forEach(key => {
            typeCounts[key] = 0;
        });
        
        // Identifier des mots-clés dans les noms des bénéficiaires
        const typeKeywords = {
            'Entreprise': ['SAS', 'SARL', 'SA', 'SNC', 'EURL', 'SCI', 'GIE'],
            'Association': ['ASSOCIATION', 'ASSO', 'ASS'],
            'Collectivité': ['COMMUNE', 'DEPARTEMENT', 'REGION', 'COMMUNAUTE', 'METROPOLE', 'MAIRIE', 'SYNDICAT'],
            'Etablissement public': ['ETABLISSEMENT PUBLIC', 'EPF', 'EPA'],
            'Etablissement de recherche': ['UNIVERSITE', 'ECOLE', 'INSTITUT', 'CNRS', 'INRA', 'INSERM', 'INRIA'],
            'Particulier': ['M.', 'MME', 'MONSIEUR', 'MADAME']
        };
        
        data.forEach(item => {
            if (item.nomBeneficiaire) {
                const name = typeof item.nomBeneficiaire === 'string' ? 
                    item.nomBeneficiaire.toUpperCase() : 
                    String(item.nomBeneficiaire).toUpperCase();
                
                let detected = false;
                
                for (const [type, keywords] of Object.entries(typeKeywords)) {
                    for (const keyword of keywords) {
                        if (name.includes(keyword)) {
                            typeCounts[type] = (typeCounts[type] || 0) + 1;
                            detected = true;
                            break;
                        }
                    }
                    if (detected) break;
                }
                
                if (!detected) {
                    typeCounts['Autre'] = (typeCounts['Autre'] || 0) + 1;
                }
            } else {
                typeCounts['Non spécifié'] = (typeCounts['Non spécifié'] || 0) + 1;
            }
        });
    }
    
    const types = Object.keys(typeCounts);
    const counts = types.map(t => typeCounts[t]);
    
    // Préparer les couleurs (palette de verts)
    const colors = generateColorGradient('#007257', '#e6f7f2', types.length);
    
    const ctx = document.getElementById('beneficiaryTypeChart').getContext('2d');
    
    // Détruire le graphique existant s'il existe
    if (appState.charts.beneficiaryType) {
        appState.charts.beneficiaryType.destroy();
    }
    
    // Créer un nouveau graphique
    appState.charts.beneficiaryType = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: types,
            datasets: [{
                label: 'Nombre de Bénéficiaires',
                data: counts,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const percent = (value / data.length * 100).toFixed(1);
                            return `${value} projets (${percent}%)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Nombre de Projets'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Type de Bénéficiaire'
                    }
                }
            }
        }
    });
}

// Exporter les données
function exportData(format) {
    if (!appState.dataReady) {
        showNotification('Aucune donnée à exporter', 'error');
        return;
    }
    
    // En fonction du format, déclencher l'exportation
    switch (format) {
        case 'csv':
            exportToCsv();
            break;
        case 'excel':
            // Simuler l'exportation Excel
            showNotification('Export Excel en cours...', 'info');
            setTimeout(() => {
                showNotification('Fonction d\'exportation Excel non implémentée', 'info');
            }, 1000);
            break;
        case 'pdf':
            // Simuler l'exportation PDF
            showNotification('Export PDF en cours...', 'info');
            setTimeout(() => {
                showNotification('Fonction d\'exportation PDF non implémentée', 'info');
            }, 1000);
            break;
    }
}

// Exporter les données au format CSV
function exportToCsv() {
    const data = appState.filteredData;
    
    if (!data || data.length === 0) {
        showNotification('Aucune donnée à exporter', 'error');
        return;
    }
    
    // Préparer l'en-tête
    const headers = [
        'Nom du bénéficiaire',
        'Dispositif d\'aide',
        'Date de la convention',
        'Montant',
        'Conditions de versement',
        'Notification UE',
        'Type de bénéficiaire'
    ];
    
    // Préparer les lignes
    const rows = data.map(item => [
        item.nomBeneficiaire,
        item.dispositifAide,
        item.dateConvention,
        item.montant,
        item.conditionsVersement,
        item.notificationUE,
        item.typeBeneficiaire
    ]);
    
    // Ajouter l'en-tête
    rows.unshift(headers);
    
    // Convertir en CSV
    let csvContent = "data:text/csv;charset=utf-8," + 
        rows.map(e => e.map(cell => {
            // Entourer de guillemets et échapper les guillemets internes
            const cellStr = String(cell || '').replace(/"/g, '""');
            return `"${cellStr}"`;
        }).join(",")).join("\n");
    
    // Créer un lien de téléchargement
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "aides_financieres_ademe_export.csv");
    document.body.appendChild(link);
    
    // Cliquer sur le lien
    link.click();
    
    // Supprimer le lien
    document.body.removeChild(link);
    
    showNotification('Export CSV téléchargé', 'success');
}

// Fonctions utilitaires

// Formatter un montant en euros
function formatCurrency(value, abbreviate = false) {
    if (value === null || value === undefined || isNaN(value)) {
        return '0 €';
    }
    
    if (abbreviate) {
        if (value >= 1000000000) {
            return (value / 1000000000).toFixed(2) + ' Md€';
        } else if (value >= 1000000) {
            return (value / 1000000).toFixed(2) + ' M€';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(1) + ' k€';
        }
    }
    
    return Math.round(value).toLocaleString() + ' €';
}

// Formatter une date
function formatDate(dateStr) {
    if (!dateStr) return '';
    
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR');
    } catch (e) {
        return dateStr;
    }
}

// Obtenir une chaîne de caractères à partir d'une valeur
function getString(value) {
    return value ? String(value).trim() : '';
}

// Obtenir un nombre à partir d'une valeur
function getNumber(value) {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
}

// Générer un dégradé de couleurs
function generateColorGradient(startColor, endColor, steps) {
    // Convertir les couleurs hexadécimales en RGB
    const start = hexToRgb(startColor);
    const end = hexToRgb(endColor);
    
    // Générer les étapes intermédiaires
    const colors = [];
    for (let i = 0; i < steps; i++) {
        const r = Math.round(start.r + (end.r - start.r) * (i / (steps - 1)));
        const g = Math.round(start.g + (end.g - start.g) * (i / (steps - 1)));
        const b = Math.round(start.b + (end.b - start.b) * (i / (steps - 1)));
        colors.push(`rgb(${r}, ${g}, ${b})`);
    }
    
    return colors;
}

// Convertir une couleur hexadécimale en RGB
function hexToRgb(hex) {
    // Supprimer le # si présent
    hex = hex.replace(/^#/, '');
    
    // Convertir en RGB
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    
    return { r, g, b };
}

// Afficher une notification
function showNotification(message, type = 'info') {
    const snackbar = document.getElementById('snackbar');
    snackbar.textContent = message;
    
    // Appliquer un style en fonction du type
    snackbar.style.backgroundColor = type === 'error' ? '#d9534f' : 
                                    type === 'success' ? '#5cb85c' : 
                                    type === 'warning' ? '#f0ad4e' : '#00a176';
    
    // Afficher la notification
    snackbar.className = 'snackbar show';
    
    // Masquer après 3 secondes
    setTimeout(() => {
        snackbar.className = snackbar.className.replace('show', '');
    }, 3000);
}

// Afficher un élément
function showElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.style.display = '';
    }
}

// Masquer un élément
function hideElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.style.display = 'none';
    }
}