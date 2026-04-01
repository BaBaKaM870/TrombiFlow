<div align="center">

# 🎓 TrombiFlow

**Application web de gestion et génération de trombinoscopes scolaires**

![Version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=flat-square&logo=github-actions&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

*Projet 2025/2026 — ESIEE-IT | Groupe : Sofiane · Yohan · Lyes · Jonas · Lucas · Sriraam*

</div>

---

## 📋 Table des matières

- [Contexte](#-contexte)
- [Fonctionnalités](#-fonctionnalités)
- [Stack technique](#-stack-technique)
- [Architecture](#-architecture)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Variables d'environnement](#-variables-denvironnement)
- [Lancer le projet](#-lancer-le-projet)
- [API Reference](#-api-reference)
- [Tests](#-tests)
- [CI/CD](#-cicd)
- [Équipe](#-équipe)

---

## 🎯 Contexte

TrombiFlow est une application web conteneurisée qui permet à l'administration scolaire de **centraliser les données élèves** et de **générer automatiquement des trombinoscopes** (par classe, promo, filière) aux formats PDF et HTML.

> Déployée via une chaîne CI/CD, elle vise à remplacer une tâche manuelle fastidieuse tout en garantissant la conformité RGPD des données personnelles.

---

## ✨ Fonctionnalités

- 📁 **CRUD Classes** — Gestion des classes (3A, 3B, M1 MIAGE, etc.)
- 👤 **CRUD Élèves** — Nom, prénom, email, classe, photo
- 📸 **Upload photo** — JPEG/PNG < 5 MB, redimensionnement automatique 300×300
- 📥 **Import CSV** — Création d'élèves en masse
- 🖼️ **Génération HTML** — Grille responsive de vignettes + noms
- 📄 **Génération PDF** — Format A4 portrait, 30–40 photos/page, footer RGPD
- 🔍 **Recherche & filtres** — Par classe, promo, nom
- 🔐 **Authentification JWT** — Rôles admin / enseignant *(option)*
- 📋 **Journalisation** — Historique des exports générés

---

## 🛠 Stack technique

| Couche | Technologie |
|--------|-------------|
| **Backend** | Node.js · Express |
| **Frontend** | React 18 · Vite |
| **Base de données** | PostgreSQL 15 |
| **Stockage fichiers** | Local `/uploads` ou S3/MinIO |
| **Génération PDF** | WeasyPrint / wkhtmltopdf |
| **Conteneurisation** | Docker · Docker Compose |
| **CI/CD** | GitHub Actions |
| **Tests** | Jest · Supertest |

---

## 🏗 Architecture

```
trombi-connecte/
├── .github/workflows/     # Pipeline CI/CD
├── backend/
│   ├── src/
│   │   ├── controllers/   # Logique métier
│   │   ├── routes/        # Endpoints REST
│   │   ├── services/      # PDF, CSV, image
│   │   └── models/        # Entités BDD
│   ├── migrations/        # Scripts SQL
│   └── tests/             # Tests Jest
├── frontend/
│   ├── src/
│   │   ├── components/    # Composants React
│   │   ├── pages/         # Pages (Classes, Élèves, Générer)
│   │   └── services/      # Appels API
│   └── tests/
├── docker-compose.yml
└── docker-compose.prod.yml
```

---

## ✅ Prérequis

- [Docker](https://www.docker.com/) >= 24 & Docker Compose >= 2
- [Node.js](https://nodejs.org/) >= 18 *(pour le dev local sans Docker)*
- [Git](https://git-scm.com/)

---

## 🚀 Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/BaBaKaM870/TrombiFlow.git
cd TrombiFlow

# 2. Copier le fichier d'environnement
cp .env.example .env

# 3. Lancer toute la stack
docker compose up -d
```

L'application sera disponible sur :
- **Frontend** → http://localhost:5173
- **API Backend** → http://localhost:3000
- **MinIO Console** → http://localhost:9001 *(si activé)*

---

## ⚙️ Variables d'environnement

Copiez `.env.example` en `.env` et renseignez les valeurs :

```env
# Base de données
DATABASE_URL=postgresql://user:password@db:5432/trombiflow

# Stockage (local ou s3)
STORAGE=local
UPLOAD_DIR=/data/uploads

# S3/MinIO (si STORAGE=s3)
S3_BUCKET=trombiflow
S3_ENDPOINT=http://minio:9000
S3_KEY=minioadmin
S3_SECRET=minioadmin

# Génération PDF
PDF_ENGINE=weasyprint   # ou wkhtmltopdf

# Auth JWT (optionnel)
JWT_SECRET=change_me_in_production

# Serveur
PORT=3000
```

---

## ▶️ Lancer le projet

**Avec Docker (recommandé)**
```bash
docker compose up -d          # Démarrer
docker compose logs -f        # Voir les logs
docker compose down           # Arrêter
```

**Sans Docker (dev local)**
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (autre terminal)
cd frontend
npm install
npm run dev
```

---

## 📡 API Reference

### Classes
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/classes` | Liste toutes les classes |
| `POST` | `/api/classes` | Créer une classe |
| `PUT` | `/api/classes/:id` | Modifier une classe |
| `DELETE` | `/api/classes/:id` | Supprimer une classe |

### Élèves
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/students?class_id=&q=` | Liste / filtre |
| `POST` | `/api/students` | Créer un élève (JSON) |
| `POST` | `/api/students/import` | Import CSV (multipart) |
| `PUT` | `/api/students/:id` | Modifier un élève |
| `DELETE` | `/api/students/:id` | Supprimer un élève |
| `POST` | `/api/students/:id/photo` | Upload photo (multipart) |

### Trombinoscope
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/trombi?class_id=&format=html\|pdf` | Générer un trombinoscope |

### Auth *(optionnel)*
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/auth/login` | Connexion → JWT |
| `GET` | `/api/me` | Profil utilisateur |

**Format CSV attendu pour l'import :**
```
first_name,last_name,email,class_label,year,photo_url
Jean,Dupont,jean.dupont@school.fr,3A,2025,
```

---

## 🧪 Tests

```bash
# Depuis la racine du projet, tout lancer en une seule commande (Bash/Git Bash)
(cd backend && npm test -- --watchAll=false) && (cd ../frontend && CI=true npm test -- --watchAll=false)

#Sur le terminal de VSC :
Set-Location backend; npm test -- --watchAll=false; Set-Location ..\frontend; $env:CI='true'; npm test -- --watchAll=false

# Lancer tous les tests backend
cd backend && npm test

# Lancer les tests frontend
cd frontend && npm test

# Avec couverture de code
npm run test:coverage
```

```powershell
# Depuis la racine du projet, tout lancer en une seule commande (PowerShell Windows)
Set-Location backend; npm test -- --watchAll=false; Set-Location ..\frontend; $env:CI='true'; npm test -- --watchAll=false
```

> Sous Windows PowerShell, utilise le bloc `powershell` ci-dessus.
> La ligne `CI=true ...` du bloc `bash` ne fonctionne pas en PowerShell.

Les tests couvrent : création classe/élève, import CSV (happy path + erreurs), upload photo → vignette générée, génération trombi HTML (statut 200) et PDF (fichier non vide).

---

## 🔄 CI/CD

Le pipeline GitHub Actions se déclenche à chaque push et comprend 3 jobs :

```
test ──► build ──► deploy
```

- **test** : installation des dépendances + exécution des tests
- **build** : construction des images Docker + push sur GHCR
- **deploy** : déploiement via SSH (`docker compose pull && up -d`)

Secrets à configurer dans GitHub → Settings → Secrets :

```
REGISTRY_USER      # Identifiant Docker Hub / GHCR
REGISTRY_TOKEN     # Token d'accès registry
SSH_HOST           # IP du serveur de déploiement
SSH_KEY            # Clé SSH privée
```

---

## 👥 Équipe

| Membre | Rôle |
|--------|------|
| **Sofiane** | DevOps — Docker, CI/CD, GitHub Actions |
| **Yohan & Lucas** | Backend — API REST, BDD, génération PDF |
| **Lyes & Jonas** | Frontend — React, formulaires, import CSV |
| **Sriraam** | Qualité & Documentation — Tests, conformité RGPD |

---

<div align="center">

*Projet réalisé dans le cadre du cours DevOps 2025/2026 — ESIEE-IT Pontoise*

⚠️ *Les données personnelles traitées par cette application sont soumises au RGPD. Tout export inclut une note de consentement en footer.*

</div>
