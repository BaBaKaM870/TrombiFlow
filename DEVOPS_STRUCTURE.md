# Structure des fichiers DevOps — TrombiFlow

Ce document recense et explique tous les fichiers liés à la partie DevOps du projet.

---

## Vue d'ensemble

```
trombiflow/
├── .github/workflows/ci.yml       # Pipeline CI/CD
├── docker-compose.yml             # Stack locale (dev)
├── docker-compose.prod.yml        # Stack production (VPS)
├── .env.example                   # Template variables d'environnement
├── backend/Dockerfile             # Image Docker backend
├── frontend/Dockerfile            # Image Docker frontend
├── frontend/nginx.conf            # Config nginx du frontend
├── DEVOPS_GUIDE_TESTS.md          # Guide de test complet pour la soutenance
└── k8s/                           # Manifests Kubernetes
    ├── namespace.yaml
    ├── serviceaccount.yaml
    ├── configmap.yaml
    ├── secret.example.yaml
    ├── postgres.yaml
    ├── backend.yaml
    ├── frontend.yaml
    ├── ingress.yaml
    ├── networkpolicy.yaml
    ├── hpa.yaml
    ├── kustomization.yaml
    ├── deploy.sh
    └── README.md
```

---

## Fichiers racine

### `.github/workflows/ci.yml`
Pipeline GitHub Actions en 5 jobs déclenchés à chaque push/PR :

| Job | Rôle |
|---|---|
| `check-versions` | Vérifie que Python, Node et Docker sont aux bonnes versions |
| `test-backend` | Lance `pytest` sur le backend FastAPI |
| `test-frontend` | Lance les tests unitaires Vue.js |
| `build` | Construit et publie les images Docker sur GHCR (GitHub Container Registry) |
| `deploy` | Déploie sur le VPS via SSH — **désactivé** (`DEPLOY_ENABLED: false`), uniquement sur `main` |

Les images sont taguées avec le SHA du commit (`${{ github.sha }}`).

---

### `docker-compose.yml`
Stack de développement local. Lance 3 services :

| Service | Image | Port |
|---|---|---|
| `db` | postgres:15-alpine | 5432 |
| `web` | Build local `backend/` | 8000 |
| `frontend` | Build local `frontend/` | 5173 |

Utilisation :
```bash
cp .env.example .env   # Adapter les valeurs
docker compose up -d
```

---

### `docker-compose.prod.yml`
Stack de production pour un VPS. Différences par rapport au dev :
- Utilise les images publiées sur GHCR (pas de build local)
- Nginx en reverse proxy avec rate limiting
- Variables d'environnement injectées par le CI/CD

---

### `.env.example`
Template à copier en `.env` avant de lancer le projet. Contient toutes les variables nécessaires avec des valeurs d'exemple.

Variables importantes :

| Variable | Valeur par défaut | Note |
|---|---|---|
| `DATABASE_URL` | `postgresql://trombiflow:your_postgres_password@db:5432/trombiflow` | `db` = nom du service Docker |
| `STORAGE_TYPE` | `s3` | Utilise Supabase Storage |
| `S3_ENDPOINT` | `https://your_project_ref.supabase.co/...` | À remplacer par ton URL Supabase |
| `JWT_SECRET` | — | Générer avec `openssl rand -base64 32` |

---

### `backend/Dockerfile`
Build multi-stage :
1. **Stage `builder`** — Installe les dépendances Python
2. **Stage final** — Image légère avec `tini` (init process) et utilisateur non-root `appuser`

Sécurité : pas de root, pas de shell inutile, surface d'attaque minimale.

---

### `frontend/Dockerfile`
Build multi-stage :
1. **Stage `builder`** — Compile le projet Vue.js avec Vite (`npm run build`)
2. **Stage final** — Sert les fichiers statiques avec nginx

---

### `frontend/nginx.conf`
Configuration nginx du conteneur frontend. Points clés :
- Rate limiting sur `/api/` (40 requêtes/burst)
- `client_max_body_size 6M` — permet les uploads photos jusqu'à 5 MB
- Proxy vers le service `web:8000` pour toutes les routes `/api/`
- Fallback HTML5 (`try_files $uri /index.html`) pour le routing Vue Router

---

### `DEVOPS_GUIDE_TESTS.md`
Guide complet pour tester et présenter la partie DevOps en soutenance. Organisé en sections :
- Tests Docker (build, volumes, healthchecks)
- Tests CI/CD (pipeline GitHub Actions)
- Tests Kubernetes (pods, services, résilience, HPA)
- Script de démonstration soutenance
- Questions/réponses type jury

---

## Dossier `k8s/`

Cluster cible : **Docker Desktop Kubernetes** (local) ou tout cluster compatible 1.24+.
Namespace : `trombiflow`

> **Minikube** : non utilisé dans ce projet. Mentionné dans `DEVOPS_GUIDE_TESTS.md` comme alternative possible, mais le cluster actif est Docker Desktop (`desktop-control-plane`).

---

### `namespace.yaml`
Crée l'espace de noms `trombiflow` qui isole toutes les ressources du projet des autres applications du cluster.

```bash
kubectl apply -f k8s/namespace.yaml
```

---

### `serviceaccount.yaml`
Crée un compte de service `trombiflow` avec les permissions RBAC minimales nécessaires. Les pods s'exécutent sous ce compte, pas sous le compte `default` du cluster.

---

### `configmap.yaml`
Variables de configuration non-sensibles injectées dans les pods :

```
ENV=production, PORT=8000, STORAGE_TYPE=local, LOG_LEVEL=info, WORKERS=4
```

> Note : `STORAGE_TYPE=local` dans le ConfigMap — à mettre à jour si Supabase est utilisé en production Kubernetes.

---

### `secret.example.yaml`
Template des secrets Kubernetes. **Ne jamais commiter le vrai `secret.yaml`.**

Contient les clés pour :
- `DATABASE_URL`, `POSTGRES_PASSWORD` — connexion PostgreSQL
- `JWT_SECRET` — signature des tokens d'authentification
- `MINIO_ROOT_USER/PASSWORD`, `S3_*` — stockage (MinIO ou Supabase)

Pour créer les secrets :
```bash
cp k8s/secret.example.yaml k8s/secret.yaml
# Éditer secret.yaml avec les vraies valeurs
kubectl apply -f k8s/secret.yaml
```

---

### `postgres.yaml`
Déploie PostgreSQL en **StatefulSet** (1 réplica) avec :
- Un `PersistentVolumeClaim` de 10 Gi pour les données
- Des probes de santé (`pg_isready`)
- L'utilisateur et la base créés depuis les secrets

---

### `backend.yaml`
Déploie le backend FastAPI en **Deployment** avec :
- 2 réplicas (haute disponibilité)
- Stratégie `RollingUpdate` (`maxUnavailable: 0`) — zéro downtime
- `PodAntiAffinity` — les 2 pods se placent sur des nœuds différents si possible
- Probes HTTP sur `/health`
- Variables injectées depuis le ConfigMap + Secret
- Filesystem en lecture seule (`readOnlyRootFilesystem: true`)

---

### `frontend.yaml`
Déploie le frontend nginx en **Deployment** avec :
- 2 réplicas
- Stratégie `RollingUpdate`
- Probes HTTP sur `/`

---

### `ingress.yaml`
Règles de routage HTTP via le **NGINX Ingress Controller** :
- `/` → service `frontend:80`
- `/api/` → service `backend:8000`

Hostname configuré : `trombiflow.local` (pour les tests locaux, ajouter dans `/etc/hosts`).

---

### `networkpolicy.yaml`
Règles de pare-feu réseau au niveau Kubernetes (2 règles) :

| Règle | Qui peut appeler | Qui est appelé | Port |
|---|---|---|---|
| `backend-allow-frontend` | pod `frontend` | pod `backend` | 8000 |
| `db-allow-backend` | pod `backend` | pod `postgres` | 5432 |

Sans ces règles, tous les pods du namespace peuvent se parler librement.

---

### `hpa.yaml`
**Horizontal Pod Autoscaler** pour le backend :
- Seuil : 70% CPU moyen
- Minimum : 2 pods
- Maximum : 6 pods

Nécessite `metrics-server` installé sur le cluster. Avec Docker Desktop :
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

---

### `kustomization.yaml`
Orchestrateur Kustomize — liste tous les manifests à appliquer ensemble. Permet aussi de surcharger les images (tag) et le nombre de réplicas sans modifier les fichiers YAML.

```bash
kubectl apply -k k8s/   # Applique via Kustomize
kubectl apply -f k8s/   # Applique fichier par fichier
```

---

### `deploy.sh`
Script bash de déploiement automatisé. Trois modes :

```bash
./k8s/deploy.sh              # Déploiement complet dans l'ordre
./k8s/deploy.sh --check-only # Vérifie le cluster sans déployer
./k8s/deploy.sh --cleanup    # Supprime tout le namespace
```

Le script vérifie automatiquement que les prérequis (kubectl, accès cluster, secrets) sont en place avant de déployer.

---

### `k8s/README.md`
Documentation Kubernetes du projet : prérequis, étapes de déploiement, troubleshooting (ImagePullBackOff, secrets manquants, PVC non liés).

---

## Commandes utiles

```bash
# Voir tous les pods
kubectl get pods -n trombiflow

# Voir les pods d'un service spécifique
kubectl get pods -l app=backend -n trombiflow

# Suivre les logs d'un pod
kubectl logs -n trombiflow -l app=backend -f

# Détails d'un pod (erreurs, events)
kubectl describe pod <nom-du-pod> -n trombiflow

# Supprimer un pod (sera recréé automatiquement par le Deployment)
kubectl delete pod <nom-du-pod> -n trombiflow

# Appliquer des changements
kubectl apply -f k8s/

# Supprimer tout le namespace
kubectl delete namespace trombiflow
```
