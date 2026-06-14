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

## Table des matières

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

## Contexte

TrombiFlow est une application web conteneurisée qui permet à l'administration scolaire de **centraliser les données élèves** et de **générer automatiquement des trombinoscopes** (par classe, promo, filière) aux formats PDF et HTML.

> Déployée via une chaîne CI/CD, elle vise à remplacer une tâche manuelle fastidieuse tout en garantissant la conformité RGPD des données personnelles.

---

## Fonctionnalités

- CRUD Classes — Gestion des classes (3A, 3B, M1 MIAGE, etc.)
- CRUD Élèves — Nom, prénom, email, classe, photo
- Upload photo — JPEG/PNG < 5 MB, redimensionnement automatique 300×300
- Import CSV — Création d'élèves en masse
- Génération HTML — Grille responsive de vignettes + noms
- Génération PDF — Format A4 portrait, 30–40 photos/page, footer RGPD
- Recherche & filtres — Par classe, promo, nom
- Authentification JWT — Rôles admin / enseignant (option)
- Journalisation — Historique des exports générés

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| **Backend** | Python 3.11 · FastAPI · uvicorn |
| **Frontend** | React 18 · Vite · Node.js 20-alpine |
| **Base de données** | PostgreSQL 15-alpine |
| **Stockage fichiers** | Local `/uploads` ou S3/MinIO |
| **Génération PDF** | ReportLab |
| **Conteneurisation** | Docker multi-stage · Docker Compose |
| **Orchestration** | Docker Compose · Kubernetes (manifests) |
| **CI/CD** | GitHub Actions (test → build → deploy) |
| **Tests** | pytest (backend) · Jest (frontend) |
| **Registry** | GitHub Container Registry (GHCR) |

---

##  Architecture

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
- [Python](https://www.python.org/) >= 3.11 *(backend FastAPI en local)*
- [Node.js](https://nodejs.org/) >= 18 *(frontend Vite en local)*
- [Git](https://git-scm.com/)

---

##  Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/BaBaKaM870/TrombiFlow.git
cd TrombiFlow

# 2. Copier le fichier d'environnement et l'éditer
cp .env.example .env   # Linux/Mac
# copy .env.example .env   # Windows

# 3. Lancer toute la stack
docker compose up -d
```

> **Important** : avant de lancer, ouvrez `.env` et renseignez au minimum :
> - `DATABASE_URL` → remplacez les valeurs par défaut. Le hostname doit être `db` (nom du service Docker), ex : `postgresql://trombiflow:monmdp@db:5432/trombiflow`
> - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` → doivent correspondre à ceux de `DATABASE_URL`
> - `JWT_SECRET` → chaîne aléatoire d'au moins 32 caractères

L'application sera disponible sur :
- **Frontend** → http://localhost:5173
- **API Backend** -> http://localhost:8000
- **MinIO Console** → http://localhost:9001 *(si activé)*

---

##  Variables d'environnement

Copiez `.env.example` en `.env` et renseignez les valeurs :

```env
# Base de données — hostname = nom du service docker-compose (db)
DATABASE_URL=postgresql://trombiflow:monmdp@db:5432/trombiflow
POSTGRES_DB=trombiflow
POSTGRES_USER=trombiflow
POSTGRES_PASSWORD=monmdp

# Stockage (local ou s3)
STORAGE_TYPE=local
UPLOAD_DIR=/data/uploads

# S3/MinIO (si STORAGE_TYPE=s3)
S3_BUCKET=trombiflow
S3_ENDPOINT=http://minio:9000
S3_KEY=minioadmin
S3_SECRET=minioadmin

# Auth JWT — minimum 32 caractères
JWT_SECRET=change_me_in_production_minimum_32_chars

# Serveur
PORT=8000
```

---

##  Lancer le projet

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
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python migrate.py
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (autre terminal)
cd frontend
npm install
npm run dev
```

---

##  API Reference

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

##  Tests

```bash
# Tests backend (pytest)
cd backend
pip install -r requirements.txt
python -m pytest -q tests/
```

```powershell
# Tests backend sous Windows PowerShell
Set-Location backend
python -m pytest -q tests/
```

Les tests couvrent : upload photo, validation type MIME, étudiant non trouvé (404), import CSV, génération trombinoscope HTML et PDF.

---

##  CI/CD

Le pipeline GitHub Actions se déclenche à chaque push sur `main` ou `devops` et comprend 5 jobs :

```
check-versions ──► test-backend ──► test-frontend ──► build ──► deploy
```

- **check-versions** : vérifie que toutes les dépendances sont épinglées (`==`)
- **test-backend** : Black, Flake8, pytest
- **test-frontend** : ESLint, Prettier (via conteneur Docker Node)
- **build** : construction des images Docker backend + frontend, push sur GHCR (tag = SHA du commit)
- **deploy** : désactivé par défaut (`DEPLOY_ENABLED: false`) — structure SSH prête pour un futur serveur

Secrets à configurer dans GitHub → Settings → Secrets (uniquement si deploy activé) :

```
SSH_HOST           # IP du serveur de déploiement
SSH_USER           # Utilisateur SSH
SSH_KEY            # Clé SSH privée (ed25519 recommandé)
```

> `GITHUB_TOKEN` est injecté automatiquement par GitHub Actions pour le push GHCR — aucune configuration manuelle nécessaire.

---

##  Équipe

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
