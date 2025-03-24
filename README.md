# Tableau de Bord des Aides Financières ADEME

![ADEME Logo](https://www.ademe.fr/wp-content/uploads/2020/02/logo-ademe.svg)

## 📊 Présentation

Une application web moderne et interactive permettant de visualiser, analyser et explorer les données des aides financières de l'ADEME (Agence de l'Environnement et de la Maîtrise de l'Énergie).

Ce tableau de bord offre une interface intuitive pour comprendre la distribution des subventions, leur évolution dans le temps, et les principaux bénéficiaires des dispositifs d'aide.

## 📋 Sommaire

- [Source des données](#-source-des-données)
- [Fonctionnalités](#-fonctionnalités)
- [Captures d'écran](#-captures-décran)
- [Installation](#-installation)
- [Utilisation](#-utilisation)
- [Structure du projet](#-structure-du-projet)
- [Technologies utilisées](#-technologies-utilisées)
- [Compatibilité navigateurs](#-compatibilité-navigateurs)
- [Améliorations futures](#-améliorations-futures)
- [Contribuer](#-contribuer)
- [Licence](#-licence)

## 🔍 Source des données

Les données utilisées dans cette application proviennent du jeu de données officiel de l'ADEME disponible sur data.gouv.fr :

[Les aides financières de l'ADEME](https://www.data.gouv.fr/fr/datasets/les-aides-financieres-de-lademe-1/)

Ce jeu de données contient des informations sur les différents dispositifs d'aide financière accordés par l'ADEME, incluant les bénéficiaires, les montants, les dates et les conditions de versement.

## ✨ Fonctionnalités

- **Importation de données** : Chargez facilement vos fichiers CSV pour générer des visualisations
- **Filtres interactifs** : Filtrez par année, dispositif d'aide, et plage de montants
- **Statistiques clés** : Visualisez rapidement le nombre total d'aides, montant total, moyen et médian
- **Visualisations dynamiques** :
  - Distribution des montants d'aide
  - Évolution temporelle des aides par année
  - Top 10 des dispositifs d'aide
  - Répartition par conditions de versement
  - Statut des notifications UE
  - Top 10 des bénéficiaires
  - Répartition par type de bénéficiaire
- **Tableaux de données** : Consultez les données détaillées dans des tableaux paginés et triables
- **Export de données** : Exportez vos analyses au format CSV

## 📷 Captures d'écran

*Ajoutez ici des captures d'écran de l'application pour illustrer son apparence et son fonctionnement.*

## 🚀 Installation

Le tableau de bord est une application web qui fonctionne directement dans le navigateur sans installation préalable. Suivez ces étapes pour l'installer sur votre serveur :

1. Clonez ce dépôt :
   ```bash
   git clone https://github.com/IA-France-Revolution/Subventions-ADEME.git
   cd Subventions-ADEME
   ```

2. Aucune dépendance à installer côté serveur n'est nécessaire. Toutes les bibliothèques sont chargées via CDN.

3. Déployez les fichiers sur votre serveur web ou ouvrez simplement `index.html` dans votre navigateur.

## 🎮 Utilisation

1. **Importer des données** :
   - Cliquez sur le bouton "Choisir un fichier" pour sélectionner votre fichier CSV des aides financières ADEME
   - Cliquez sur "Analyser les données" pour générer le tableau de bord

2. **Filtrer les données** :
   - Utilisez la section "Filtrer les données" pour affiner votre analyse
   - Sélectionnez une année, un dispositif d'aide, ou définissez une plage de montants
   - Cliquez sur "Appliquer les filtres" pour mettre à jour les visualisations

3. **Explorer les visualisations** :
   - Consultez les différents graphiques et tableaux pour analyser les données
   - Passez votre souris sur les graphiques pour afficher les détails
   - Utilisez les fonctionnalités de tri et de recherche dans les tableaux

4. **Exporter les résultats** :
   - Cliquez sur le bouton "CSV" pour exporter les données filtrées au format CSV

## 📁 Structure du projet

Le projet suit une architecture simple et modulaire avec séparation des préoccupations :

```
tableau-bord-ademe/
│
├── index.html        # Structure HTML et éléments de l'interface
├── styles.css        # Styles et mise en page
├── script.js         # Logique applicative et visualisations de données
├── README.md         # Documentation du projet
└── LICENSE           # Informations de licence
```

## 💻 Technologies utilisées

- **HTML5** : Structure de l'application
- **CSS3** : Styles et mise en page responsive
- **JavaScript (ES6+)** : Logique applicative
- **Bibliothèques externes** :
  - [Chart.js](https://www.chartjs.org/) (v3.9.1) : Visualisations graphiques
  - [PapaParse](https://www.papaparse.com/) (v5.3.2) : Analyse CSV
  - [Lodash](https://lodash.com/) (v4.17.21) : Utilitaires JavaScript
  - [jQuery](https://jquery.com/) (v3.6.0) : Manipulation DOM
  - [DataTables](https://datatables.net/) (v1.10.21) : Tableaux interactifs
  - [Bootstrap](https://getbootstrap.com/) (v4.6.1) : Framework CSS
  - [Font Awesome](https://fontawesome.com/) (v5.15.4) : Icônes

## 🌐 Compatibilité navigateurs

Le tableau de bord est compatible avec les navigateurs modernes :

- Chrome (dernières versions)
- Firefox (dernières versions)
- Safari (dernières versions)
- Edge (dernières versions)
- Opera (dernières versions)

## 🚧 Améliorations futures

- Ajouter une visualisation cartographique pour la répartition géographique des aides
- Développer des analyses prédictives et tendancielles
- Intégrer l'authentification pour sauvegarder les configurations utilisateur
- Ajouter une fonctionnalité de comparaison entre années ou dispositifs
- Améliorer l'accessibilité pour se conformer aux normes RGAA
- Développer une API pour l'accès programmatique aux données
- Ajouter des fonctionnalités d'export PDF et Excel complètes

## 👥 Contribuer

Les contributions à ce projet sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créez votre branche de fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est distribué sous la licence MIT. Voir le fichier `LICENSE` pour plus d'informations.

---

Développé avec ❤️ par l'équipe d'AIfr.ai | Dernière mise à jour : Mars 2025

*Ce tableau de bord n'est pas officiellement affilié à l'ADEME. Les données présentées sont issues de sources publiques et peuvent être utilisées conformément aux licences de données ouvertes.*
