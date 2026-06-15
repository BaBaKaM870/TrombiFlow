# DEVOPS_GUIDE_TESTS.md
# TrombiFlow — Guide DevOps complet : tests, procédures et préparation à la soutenance

**Projet** : TrombiFlow — Génération de trombinoscopes scolaires  
**Année** : 2025/2026 — ESIEE-IT Pontoise  
**Version** : 1.0

---

## Table des matières

1. [Présentation de ma partie DevOps](#1-présentation-de-ma-partie-devops)
2. [Architecture de la solution](#2-architecture-de-la-solution)
3. [Guide de tests Docker](#3-guide-de-tests-docker)
4. [Guide de tests Docker Compose](#4-guide-de-tests-docker-compose)
5. [Guide de tests GitHub Actions](#5-guide-de-tests-github-actions)
6. [Guide de tests Kubernetes](#6-guide-de-tests-kubernetes)
7. [Tests de résilience](#7-tests-de-résilience)
8. [Tests de montée en charge](#8-tests-de-montée-en-charge)
9. [Procédure de rollback](#9-procédure-de-rollback)
10. [Préparation à la soutenance](#10-préparation-à-la-soutenance)
11. [Questions possibles du jury](#11-questions-possibles-du-jury)
12. [Analyse finale](#12-analyse-finale)

---

## 1. Présentation de ma partie DevOps

### Mes responsabilités dans le projet

Dans ce projet de groupe, chaque membre a un rôle défini. Le backend est réalisé par Yohan et Lucas (API FastAPI, base de données, génération PDF). Le frontend est réalisé par Lyes et Jonas (interface React, formulaires). Ma responsabilité couvre entièrement la partie DevOps du projet.

Concrètement, j'ai pris en charge :

- La **conteneurisation** de l'application avec Docker (écriture des Dockerfiles backend et frontend)
- L'**orchestration locale** avec Docker Compose pour que tout le monde puisse lancer la stack en une seule commande
- La **chaîne CI/CD** avec GitHub Actions : automatisation des tests, du build des images et du déploiement
- La **registry d'images** sur GitHub Container Registry (GHCR) pour stocker les images Docker buildées
- Les **manifests Kubernetes** pour le déploiement en production (12 fichiers YAML)
- La **sécurité** des conteneurs et des déploiements (utilisateurs non-root, droits minimaux, secrets)
- La **documentation** technique du projet côté infrastructure

### Objectifs du DevOps dans TrombiFlow

L'objectif principal du DevOps dans ce projet est de garantir que l'application peut être livrée de façon fiable, reproductible et automatisée. Sans cette partie, chaque développeur devrait configurer manuellement son environnement, les tests ne seraient pas automatisés, et le déploiement dépendrait d'une intervention humaine à chaque fois.

En pratique, le DevOps répond à plusieurs problèmes concrets :

- **"Ça marche sur mon PC"** : Grâce à Docker, l'application fonctionne de la même façon sur tous les postes et en production.
- **Qualité du code** : Le pipeline CI vérifie automatiquement le formatage et les tests à chaque `git push`.
- **Déploiement sans interruption** : Kubernetes gère les mises à jour progressives (rolling update) sans couper le service.
- **Disponibilité** : Si un pod plante, Kubernetes le redémarre automatiquement.

### Pourquoi Docker ?

Docker permet de packager l'application avec toutes ses dépendances dans une image portable. Pour TrombiFlow, cela signifie que le backend FastAPI, avec Python 3.11 et toutes ses librairies (psycopg2, reportlab, pillow...), est encapsulé dans une image qui fonctionnera de la même façon en local, en CI et en production.

J'ai utilisé des **builds multi-stage** pour réduire la taille des images : une étape `builder` installe toutes les dépendances, une étape `runtime` ne contient que le strict nécessaire. Le Dockerfile backend produit une image sécurisée avec un utilisateur non-root (`appuser`), sans outils de développement.

### Pourquoi Docker Compose ?

Docker Compose permet de démarrer l'ensemble de la stack en une seule commande : `docker compose up -d`. Sans ça, il faudrait démarrer PostgreSQL, MinIO, le backend et le frontend manuellement, dans le bon ordre, avec les bonnes variables d'environnement. C'est fastidieux et source d'erreurs.

J'ai créé deux fichiers compose :
- `docker-compose.yml` : pour le développement local
- `docker-compose.prod.yml` : pour la production, avec un durcissement de sécurité supplémentaire

### Pourquoi GitHub Actions ?

GitHub Actions permet d'automatiser les vérifications à chaque push sur le dépôt. Sans pipeline CI, un développeur pourrait pousser du code cassé, des tests qui échouent, ou une image Docker qui ne se build pas. Avec le pipeline, tout cela est détecté automatiquement.

Le pipeline TrombiFlow suit le schéma classique : `test → build → deploy`. Il vérifie les dépendances épinglées, lance les tests backend, analyse le code (Black, Flake8), build les images Docker et les pousse sur GHCR.

### Pourquoi Kubernetes ?

Kubernetes est un orchestrateur de conteneurs. Il permet de gérer des déploiements multi-instances, de maintenir le nombre de pods souhaité, d'effectuer des mises à jour sans interruption et d'adapter automatiquement le nombre d'instances selon la charge (HPA).

Pour TrombiFlow, j'ai défini 2 replicas pour le backend et le frontend, ce qui signifie que si un pod tombe, l'autre continue de servir les requêtes pendant que Kubernetes recrée le pod manquant.

### Bénéfices apportés au projet

| Bénéfice | Sans DevOps | Avec DevOps (TrombiFlow) |
|---|---|---|
| Lancer la stack | Configuration manuelle de chaque service | `docker compose up -d` |
| Tester le code | Manuel, peut être oublié | Automatique à chaque push |
| Déployer | Intervention manuelle sur le serveur | Automatique via SSH après merge |
| Disponibilité | Un crash = service coupé | Pod redémarré automatiquement |
| Montée en charge | Manuelle et lente | HPA scale automatiquement |
| Rollback | Difficile à tracer | `kubectl rollout undo` en 5 secondes |

---

## 2. Architecture de la solution

### Description des composants

**Frontend** — Image Docker `nginx:1.27-alpine` qui sert l'application React compilée. Il joue aussi le rôle de proxy : les requêtes vers `/api/` sont redirigées vers le backend, les requêtes vers `/uploads/` également. En Kubernetes, 2 replicas assurent la disponibilité.

**Backend** — Image Docker `python:3.11-slim` qui exécute FastAPI via uvicorn. Il expose l'API REST sur le port 8000. Les migrations SQL sont exécutées automatiquement au démarrage via `entrypoint.sh`. En Kubernetes, 2 replicas avec rolling update zero-downtime.

**PostgreSQL** — Base de données relationnelle `postgres:15-alpine`. Les données sont persistées dans un volume Docker. En Kubernetes, c'est un StatefulSet avec un PersistentVolumeClaim de 10 Go.

**MinIO** — Serveur de stockage compatible S3. Il stocke les photos des étudiants. L'interface de gestion est accessible sur le port 9001. En production, l'image est épinglée par digest SHA256 pour éviter les changements inattendus.

**GitHub Actions** — Pipeline CI/CD déclenché à chaque push. Il vérifie les dépendances, lance les tests, analyse le code, build les images Docker et les pousse sur GHCR.

**GHCR (GitHub Container Registry)** — Registry Docker hébergée par GitHub. Les images sont taguées avec le SHA du commit pour tracer précisément quelle version est déployée.

**Kubernetes** — Orchestrateur de conteneurs. Il gère le cycle de vie des pods, la découverte de services, l'autoscaling et les politiques réseau.

### Schéma d'architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         DÉVELOPPEMENT                           │
│                                                                 │
│   git push ──► GitHub Actions ──► GHCR                         │
│                    │                 (images Docker)            │
│            ┌───────┴────────┐                                   │
│            │  test-backend  │                                   │
│            │  test-frontend │                                   │
│            │  build & push  │                                   │
│            │  deploy (SSH)  │                                   │
│            └────────────────┘                                   │
└─────────────────────────────────────────────────────────────────┘
                               │
                    SSH deploy / kubectl apply
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                     KUBERNETES CLUSTER                          │
│  namespace: trombiflow                                          │
│                                                                 │
│  [Ingress NGINX]  trombiflow.local                              │
│       │                                                         │
│       │  /  ──────────────► [Service: frontend :80]            │
│       │                          └── Pod frontend              │
│       │                          └── Pod frontend  (×2)        │
│       │                               nginx:1.27-alpine        │
│       │                                    │ proxy /api        │
│       │                                    ▼                   │
│       └──────────────────────► [Service: backend :8000]        │
│                                      └── Pod backend           │
│                                      └── Pod backend  (×2)    │
│                                           FastAPI              │
│                                               │         │      │
│                                      ┌────────┘  ┌──────┘     │
│                                      ▼            ▼            │
│                             [Service: postgres] [Service: minio]│
│                                  StatefulSet    Deployment     │
│                                  PVC 10Gi       PVC 10Gi       │
│                                                                 │
│  [HPA] backend: 2→6 replicas   [HPA] frontend: 2→6 replicas   │
│  [NetworkPolicy] frontend→backend:8000, backend→postgres:5432  │
│  [ConfigMap] variables non-sensibles                           │
│  [Secret] trombiflow-secrets (DB, JWT, MinIO)                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    DÉVELOPPEMENT LOCAL                          │
│                                                                 │
│  docker compose up -d                                           │
│                                                                 │
│  [frontend :5173] ──proxy /api──► [backend :8000]              │
│                                        │                       │
│                              [db :5432] [minio :9000/:9001]    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Guide de tests Docker

### Prérequis

```bash
docker --version
# Attendu : Docker version 24.x ou supérieur

docker compose version
# Attendu : Docker Compose version v2.x
```

---

### Test 3.1 — Build de l'image backend

**Objectif** : Vérifier que le Dockerfile backend compile correctement et produit une image fonctionnelle.

```bash
docker build -t trombiflow-backend:test ./backend
```

**Résultat attendu** :
```
=> [builder] pip install ...     DONE
=> [runtime] COPY src            DONE
=> exporting to image            DONE
```

**Vérification** :
```bash
docker images | grep trombiflow-backend
# trombiflow-backend   test   abc123...   X seconds ago   XXX MB
```

**Interprétation** : Si le build réussit sans erreur, le Dockerfile est valide. Si pip échoue, il y a un problème dans `requirements.txt`. La taille de l'image doit être raisonnable (environ 200-300 Mo pour le backend Python).

---

### Test 3.2 — Build de l'image frontend

**Objectif** : Vérifier que le Dockerfile frontend compile le code React et produit une image Nginx.

```bash
docker build -t trombiflow-frontend:test ./frontend
```

**Résultat attendu** :
```
=> [build] npm ci                DONE
=> [build] npm run build         DONE
=> [runtime] COPY webroot        DONE
=> exporting to image            DONE
```

**Interprétation** : La construction se fait en deux étapes. Si `npm run build` échoue, il y a une erreur dans le code React. Si la copie du dossier `dist` échoue, le build Vite n'a pas produit le bon dossier de sortie.

---

### Test 3.3 — Vérification de l'utilisateur non-root

**Objectif** : S'assurer que le conteneur backend ne tourne pas en root (bonne pratique de sécurité).

```bash
docker run --rm trombiflow-backend:test whoami
```

**Résultat attendu** :
```
appuser
```

**Interprétation** : Si la réponse est `root`, le Dockerfile n'applique pas correctement la directive `USER`. En production, un conteneur root est un risque de sécurité : si un attaquant prend le contrôle du conteneur, il a les droits root sur le système hôte.

---

### Test 3.4 — Vérification du healthcheck frontend

**Objectif** : Vérifier que le healthcheck défini dans le Dockerfile frontend fonctionne.

```bash
docker run -d --name test-frontend -p 9090:80 trombiflow-frontend:test
sleep 5
docker inspect test-frontend --format='{{.State.Health.Status}}'
```

**Résultat attendu** :
```
healthy
```

**Nettoyage** :
```bash
docker rm -f test-frontend
```

**Interprétation** : `healthy` signifie que le `wget` interne au healthcheck a réussi à atteindre `http://127.0.0.1/`. Si le résultat est `unhealthy`, Nginx ne répond pas correctement.

---

### Test 3.5 — Inspection de la taille des images

**Objectif** : Vérifier que les builds multi-stage ont bien réduit la taille des images.

```bash
docker images | grep trombiflow
```

**Résultat attendu** :

| Image | Taille attendue |
|---|---|
| `trombiflow-backend:test` | ~200-350 Mo |
| `trombiflow-frontend:test` | ~30-60 Mo |

**Interprétation** : Le multi-stage build est justement là pour éviter d'inclure les outils de compilation (pip, npm, node_modules) dans l'image finale. Une image backend de 1 Go indiquerait que le multi-stage ne fonctionne pas.

---

### Test 3.6 — Vérification du .dockerignore

**Objectif** : S'assurer que les fichiers sensibles (`.env`, `node_modules`, `__pycache__`) ne sont pas inclus dans les images.

```bash
docker run --rm trombiflow-backend:test ls -la /app/
```

**Résultat attendu** :
```
drwxr-xr-x  src/
drwxr-xr-x  migrations/
-rwxr-xr-x  entrypoint.sh
-rwxr-xr-x  migrate.py
```

**Interprétation** : Les dossiers `tests/`, `.venv/`, `__pycache__` et le fichier `.env` ne doivent pas apparaître. Leur présence signifierait que le `.dockerignore` est mal configuré.

---

## 4. Guide de tests Docker Compose

### Prérequis

S'assurer d'avoir un fichier `.env` correctement rempli à la racine du projet :

```bash
cp .env.example .env
# Puis modifier les valeurs dans .env :
# DATABASE_URL=postgresql://trombiflow:trombiflow123@db:5432/trombiflow
# POSTGRES_PASSWORD=trombiflow123
# JWT_SECRET=trombiflow_dev_jwt_secret_minimum_32_chars_ok
# MINIO_ROOT_USER=minioadmin
# MINIO_ROOT_PASSWORD=minioadmin123
```

---

### Test 4.1 — Démarrage complet de la stack

**Objectif** : Lancer l'intégralité de l'application en une seule commande.

```bash
docker compose up -d
```

**Résultat attendu** :
```
 Container trombiflow-db       Started
 Container trombiflow-minio    Started
 Container trombiflow-db       Healthy
 Container trombiflow-web      Started
 Container trombiflow-frontend Started
```

**Point important** : La ligne `trombiflow-db Healthy` doit apparaître AVANT `trombiflow-web Started`. C'est le `depends_on: condition: service_healthy` qui garantit cet ordre. Sans ça, le backend essaierait de se connecter à la BDD avant qu'elle soit prête.

---

### Test 4.2 — Vérification de l'état des conteneurs

**Objectif** : S'assurer que les 4 conteneurs tournent et sont dans un état stable.

```bash
docker compose ps
```

**Résultat attendu** :
```
NAME                  IMAGE                STATUS              PORTS
trombiflow-db         postgres:15-alpine   Up (healthy)        0.0.0.0:5432->5432/tcp
trombiflow-frontend   trombiflow-frontend  Up (healthy)        0.0.0.0:5173->80/tcp
trombiflow-minio      minio/minio:latest   Up                  0.0.0.0:9000-9001->9000-9001/tcp
trombiflow-web        trombiflow-web       Up                  0.0.0.0:8000->8000/tcp
```

**Interprétation** :
- `Up (healthy)` : le conteneur tourne ET le healthcheck est passé
- `Up` : le conteneur tourne mais sans healthcheck configuré (cas de MinIO)
- `Restarting` : le conteneur plante en boucle — vérifier les logs avec `docker compose logs <service>`
- `Exit 1` : le conteneur a planté — regarder les logs

---

### Test 4.3 — Vérification que l'API répond

**Objectif** : Confirmer que le backend est accessible et fonctionnel.

```bash
# Endpoint de santé (pas d'authentification requise)
curl http://localhost:8000/health
```

**Résultat attendu** :
```json
{"status": "ok"}
```

```bash
# Documentation Swagger (utile pour la démo)
curl -o /dev/null -s -w "%{http_code}" http://localhost:8000/docs
```

**Résultat attendu** : `200`

---

### Test 4.4 — Vérification du frontend

**Objectif** : Confirmer que le frontend est accessible.

```bash
curl -o /dev/null -s -w "%{http_code}" http://localhost:5173
```

**Résultat attendu** : `200`

---

### Test 4.5 — Vérification réseau inter-conteneurs

**Objectif** : S'assurer que les conteneurs peuvent communiquer entre eux sur le réseau Docker interne.

```bash
# Tester la connectivité backend → PostgreSQL
docker compose exec web python -c "
import psycopg2, os
conn = psycopg2.connect(os.environ['DATABASE_URL'])
print('Connexion BDD : OK')
conn.close()
"
```

**Résultat attendu** :
```
Connexion BDD : OK
```

```bash
# Tester la résolution DNS interne (le backend doit résoudre "db")
docker compose exec web ping -c 2 db
```

**Résultat attendu** : Réponse ICMP avec le nom `db` résolu.

**Interprétation** : Docker Compose crée automatiquement un réseau `bridge` et configure le DNS pour que chaque service soit accessible par son nom (`db`, `minio`, `web`, `frontend`). Si le ping échoue, les services ne sont pas sur le même réseau.

---

### Test 4.6 — Vérification des volumes

**Objectif** : Confirmer que les volumes Docker sont créés et montés.

```bash
docker volume ls | grep trombiflow
```

**Résultat attendu** :
```
local     trombiflow_db_data
local     trombiflow_minio_data
local     trombiflow_uploads_data
```

```bash
# Inspecter le volume de la base de données
docker volume inspect trombiflow_db_data
```

**Résultat attendu** : Un objet JSON avec `"Mountpoint"` indiquant le chemin réel sur l'hôte.

---

### Test 4.7 — Vérification de la persistance des données

**Objectif** : Prouver que les données survivent à un redémarrage des conteneurs.

```bash
# Étape 1 : Créer un utilisateur via l'API
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testpersistance","email":"test@ecole.fr","password":"Test1234!"}'

# Étape 2 : Arrêter les conteneurs SANS supprimer les volumes
docker compose down

# Étape 3 : Redémarrer
docker compose up -d

# Attendre que le backend soit prêt
sleep 10

# Étape 4 : Vérifier que l'utilisateur existe encore (login)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ecole.fr","password":"Test1234!"}'
```

**Résultat attendu** : La réponse contient un token JWT. L'utilisateur créé à l'étape 1 est toujours présent après le redémarrage.

**Interprétation** : Si le login échoue avec `Invalid credentials`, c'est que les données n'ont pas été persistées. Cela arriverait si les volumes n'étaient pas configurés ou si `docker compose down -v` avait été utilisé (le `-v` supprime les volumes).

---

### Test 4.8 — Vérification des logs

**Objectif** : Savoir lire les logs de chaque service pour diagnostiquer un problème.

```bash
# Logs du backend
docker compose logs web --tail=20

# Logs de la base de données
docker compose logs db --tail=10

# Suivre les logs en temps réel
docker compose logs -f web
```

**Résultat attendu pour le backend** :
```
trombiflow-web | [entrypoint] running migrations...
trombiflow-web | [migrate] apply 001_create_classes.sql ... ok
trombiflow-web | [migrate] apply 002_create_students.sql ... ok
...
trombiflow-web | [entrypoint] starting uvicorn on port 8000...
trombiflow-web | INFO:     Started server process
trombiflow-web | INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

### Test 4.9 — Vérification de la configuration prod

**Objectif** : Valider que `docker-compose.prod.yml` est syntaxiquement correct.

```bash
docker compose -f docker-compose.prod.yml config --quiet
echo "Config prod : OK"
```

**Note** : Ce fichier utilise des images pré-buildées depuis GHCR. Pour le tester complètement, il faut avoir les variables `IMAGE_TAG` et `GITHUB_REPOSITORY_LOWER` définies dans le `.env`.

---

## 5. Guide de tests GitHub Actions

### Déclencher le pipeline

Le pipeline se déclenche automatiquement dans trois cas :
1. Un `git push` sur la branche `main` ou `devops`
2. Une Pull Request vers `main`
3. Manuellement via l'interface GitHub

**Déclenchement manuel depuis la ligne de commande (avec `gh` CLI)** :
```bash
gh workflow run ci.yml --ref main
```

**Déclenchement manuel depuis GitHub** :
1. Aller sur le dépôt → onglet **Actions**
2. Sélectionner le workflow **CI-CD**
3. Cliquer **Run workflow** → choisir la branche → **Run workflow**

---

### Test 5.1 — Vérifier l'état du pipeline

```bash
# Voir les dernières exécutions du pipeline
gh run list --workflow=ci.yml --limit=5
```

**Résultat attendu** :
```
STATUS     TITLE                 WORKFLOW  BRANCH  EVENT  ID
✓ completed  feat: ajout étudiant  CI-CD    main    push   1234567890
```

**Interprétation des statuts** :
- `completed` (vert) : tous les jobs ont réussi
- `in_progress` : le pipeline tourne encore
- `failure` : au moins un job a échoué — voir les détails

---

### Test 5.2 — Vérifier le job `check-versions`

**Objectif** : S'assurer que toutes les dépendances Python sont épinglées à une version précise.

```bash
# Tester en local ce que fait la CI
bash scripts/check-versions.sh
```

**Résultat attendu** :
```
Checking for non-pinned versions in Python dependencies...
✅ All Python dependencies are pinned in requirements.txt

Checking for caret (^) or tilde (~) in package.json files...
All versions in frontend/package.json are pinned (no ^ or ~ used)

All dependency versions are properly pinned!
```

**Pourquoi c'est important** : Si une dépendance n'est pas épinglée (exemple : `boto3` sans numéro de version), le pip install peut télécharger une version incompatible la prochaine fois. Les builds ne sont plus reproductibles.

---

### Test 5.3 — Vérifier le job `test-backend`

**Objectif** : Lancer localement les mêmes vérifications que la CI.

```bash
# Dans un container (même environnement que la CI)
docker run --rm \
  -v "$(pwd)/backend:/app" \
  -w /app \
  python:3.11-slim \
  bash -c "
    pip install -r requirements.txt black flake8 -q &&
    echo '--- Black ---' &&
    python -m black --check src/ tests/ migrate.py &&
    echo '--- Flake8 ---' &&
    python -m flake8 src/ tests/ migrate.py --max-line-length=100 --ignore=E203,W503 &&
    echo '--- Pytest ---' &&
    python -m pytest tests/ -v
  "
```

**Résultat attendu** :
```
--- Black ---
All done! ✨ 🍰 ✨
--- Flake8 ---
(aucune sortie = aucune erreur)
--- Pytest ---
35 passed in X.XXs
```

---

### Test 5.4 — Vérifier les images sur GHCR

**Objectif** : Confirmer que les images buildées par la CI sont disponibles sur GHCR.

```bash
# Voir les packages du dépôt
gh api /orgs/babakam870/packages?package_type=container 2>/dev/null || \
gh api /users/babakam870/packages?package_type=container
```

Ou directement sur GitHub :
1. Aller sur le profil GitHub → **Packages**
2. Chercher `trombiflow/backend` et `trombiflow/frontend`
3. Vérifier que le dernier tag correspond au dernier commit SHA

**Télécharger et tester une image depuis GHCR** :
```bash
# Se connecter à GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Télécharger l'image backend
docker pull ghcr.io/babakam870/trombiflow/backend:latest

# Vérifier qu'elle tourne
docker run --rm ghcr.io/babakam870/trombiflow/backend:latest python --version
```

---

### Test 5.5 — Vérifier le détail d'un job en échec

Si un job échoue, voici comment diagnostiquer :

```bash
# Voir le détail de la dernière exécution
gh run view --log-failed
```

Ou depuis GitHub :
1. Aller sur **Actions** → cliquer sur l'exécution échouée
2. Cliquer sur le job rouge
3. Développer l'étape qui a échoué pour lire l'erreur

**Erreurs courantes** :
- `black --check` échoue → le code n'est pas formaté : `python -m black src/` pour corriger
- `flake8` échoue → il y a une violation de style : lire le message d'erreur (fichier:ligne)
- `pytest` échoue → un test a échoué : lire le traceback

---

## 6. Guide de tests Kubernetes

### Prérequis

Avoir un cluster Kubernetes opérationnel. Pour les tests locaux, Minikube ou Docker Desktop avec Kubernetes activé suffisent.

```bash
# Vérifier que kubectl est installé et connecté
kubectl version --short
kubectl cluster-info
kubectl get nodes
```

**Résultat attendu** :
```
Kubernetes control plane is running at https://...
NAME       STATUS   ROLES           AGE
minikube   Ready    control-plane   Xd
```

---

### Test 6.1 — Déploiement initial

```bash
# Étape 1 : Créer le namespace
kubectl apply -f k8s/namespace.yaml

# Étape 2 : Créer les secrets (AVANT tout déploiement)
kubectl create secret generic trombiflow-secrets \
  -n trombiflow \
  --from-literal=DATABASE_URL="postgresql://trombiflow:demo1234@postgres:5432/trombiflow" \
  --from-literal=POSTGRES_DB=trombiflow \
  --from-literal=POSTGRES_USER=trombiflow \
  --from-literal=POSTGRES_PASSWORD=demo1234 \
  --from-literal=JWT_SECRET=trombiflow_demo_jwt_secret_32chars_ok \
  --from-literal=MINIO_ROOT_USER=minioadmin \
  --from-literal=MINIO_ROOT_PASSWORD=minioadmin123 \
  --from-literal=S3_BUCKET=trombiflow \
  --from-literal=S3_ENDPOINT="http://minio:9000" \
  --from-literal=S3_KEY=minioadmin \
  --from-literal=S3_SECRET=minioadmin123

# Étape 3 : Déployer tout le reste
kubectl apply -f k8s/serviceaccount.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/minio.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/networkpolicy.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
```

Ou via le script fourni :
```bash
bash k8s/deploy.sh
```

---

### Test 6.2 — Vérification des pods

**Objectif** : S'assurer que tous les pods démarrent et passent en état `Running`.

```bash
kubectl get pods -n trombiflow -o wide
```

**Résultat attendu** :
```
NAME                        READY   STATUS    RESTARTS   AGE    NODE
backend-78945bd-4k5m9       1/1     Running   0          2m     node1
backend-78945bd-8f9jx       1/1     Running   0          2m     node2
frontend-5d6c7e4f9-2k3m1    1/1     Running   0          2m     node1
frontend-5d6c7e4f9-9l2p8    1/1     Running   0          2m     node2
postgres-0                  1/1     Running   0          3m     node1
minio-8f9j0k1l2-p5q6r       1/1     Running   0          3m     node2
```

**Interprétation** :
- `1/1 Running` : le pod est prêt et en cours d'exécution
- `0/1 Pending` : le pod attend une ressource (nœud disponible, PVC...)
- `0/1 CrashLoopBackOff` : le pod redémarre en boucle — `kubectl logs <pod> -n trombiflow`
- `0/1 ImagePullBackOff` : impossible de télécharger l'image Docker

**Attendre que les pods soient prêts** :
```bash
kubectl wait --for=condition=ready pod -l app=postgres -n trombiflow --timeout=120s
kubectl wait --for=condition=ready pod -l app=backend -n trombiflow --timeout=120s
kubectl wait --for=condition=ready pod -l app=frontend -n trombiflow --timeout=60s
```

---

### Test 6.3 — Vérification des services

**Objectif** : S'assurer que les services Kubernetes exposent correctement les pods.

```bash
kubectl get svc -n trombiflow
```

**Résultat attendu** :
```
NAME            TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)             AGE
backend         ClusterIP   10.96.14.23     <none>        8000/TCP            3m
frontend        ClusterIP   10.96.28.45     <none>        80/TCP              3m
postgres        ClusterIP   None            <none>        5432/TCP            4m
minio           ClusterIP   10.96.55.12     <none>        9000/TCP,9001/TCP   4m
minio-console   ClusterIP   10.96.55.13     <none>        9001/TCP            4m
```

**Tester l'accès depuis l'intérieur du cluster** :
```bash
# Port-forward pour accéder localement
kubectl port-forward svc/frontend 5173:80 -n trombiflow &
kubectl port-forward svc/backend 8000:8000 -n trombiflow &

# Tester l'API
curl http://localhost:8000/health
# Réponse attendue : {"status": "ok"}

# Tester le frontend
curl -o /dev/null -s -w "%{http_code}" http://localhost:5173
# Réponse attendue : 200
```

---

### Test 6.4 — Vérification de l'Ingress

**Objectif** : Accéder à l'application via le nom de domaine configuré.

```bash
kubectl get ingress -n trombiflow
```

**Résultat attendu** :
```
NAME                  CLASS   HOSTS              ADDRESS         PORTS   AGE
trombiflow-ingress    nginx   trombiflow.local   192.168.x.x    80      2m
```

**Configuration locale pour tester l'Ingress** :
```bash
# Ajouter l'entrée dans le fichier hosts (Linux/macOS)
echo "127.0.0.1 trombiflow.local" | sudo tee -a /etc/hosts

# Windows (PowerShell administrateur)
Add-Content C:\Windows\System32\drivers\etc\hosts "127.0.0.1 trombiflow.local"

# Port-forward de l'ingress controller (Minikube)
kubectl port-forward svc/ingress-nginx-controller 80:80 -n ingress-nginx &

# Tester l'accès
curl -H "Host: trombiflow.local" http://localhost/
curl -H "Host: trombiflow.local" http://localhost/api/classes/
```

---

### Test 6.5 — Vérification des PersistentVolumeClaims

```bash
kubectl get pvc -n trombiflow
```

**Résultat attendu** :
```
NAME           STATUS   VOLUME        CAPACITY   ACCESS MODES   STORAGECLASS   AGE
postgres-pvc   Bound    pvc-abc123    10Gi       RWO            standard       5m
minio-pvc      Bound    pvc-def456    10Gi       RWO            standard       5m
```

**Interprétation** : Le statut doit être `Bound`. Si c'est `Pending`, le cluster n'a pas de StorageClass disponible — vérifier avec `kubectl get storageclass`.

---

### Test 6.6 — Vérification de la ConfigMap

```bash
kubectl get configmap trombiflow-config -n trombiflow -o yaml
```

**Résultat attendu** : Un objet YAML contenant les variables non-sensibles : `ENV=production`, `PORT=8000`, `STORAGE_TYPE=local`, `UPLOAD_DIR=/data/uploads`.

---

### Test 6.7 — Vérification du Secret

```bash
# Vérifier que le secret existe (sans afficher les valeurs)
kubectl get secret trombiflow-secrets -n trombiflow

# Voir les clés du secret (pas les valeurs)
kubectl get secret trombiflow-secrets -n trombiflow \
  -o jsonpath='{.data}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('\n'.join(d.keys()))"
```

**Résultat attendu** :
```
DATABASE_URL
JWT_SECRET
MINIO_ROOT_USER
MINIO_ROOT_PASSWORD
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
S3_BUCKET
S3_ENDPOINT
S3_KEY
S3_SECRET
```

**Important** : Ne jamais afficher les valeurs des secrets devant un jury ou dans un log public. Les valeurs sont encodées en base64 dans Kubernetes, ce n'est pas du chiffrement.

---

### Test 6.8 — Vérification du HPA

```bash
kubectl get hpa -n trombiflow
```

**Résultat attendu** :
```
NAME           REFERENCE             TARGETS         MINPODS   MAXPODS   REPLICAS   AGE
backend-hpa    Deployment/backend    <unknown>/70%   2         6         2          3m
frontend-hpa   Deployment/frontend   <unknown>/70%   2         6         2          3m
```

**Note** : `<unknown>` dans la colonne TARGETS signifie que le metrics-server n'est pas installé. Pour Minikube :
```bash
minikube addons enable metrics-server
# Attendre 2 minutes puis relancer
kubectl get hpa -n trombiflow
```

Avec le metrics-server :
```
NAME           REFERENCE             TARGETS    MINPODS   MAXPODS   REPLICAS
backend-hpa    Deployment/backend    5%/70%     2         6         2
```

---

## 7. Tests de résilience

La résilience est la capacité du système à continuer à fonctionner malgré des défaillances. C'est l'un des points forts de Kubernetes.

### 7.1 — Suppression volontaire d'un pod

**Objectif** : Montrer que si un pod tombe, Kubernetes le recrée automatiquement.

**Prérequis** : Avoir le port-forward actif pour vérifier la continuité de service.
```bash
kubectl port-forward svc/backend 8000:8000 -n trombiflow &
```

**Étape 1 — Identifier un pod backend**
```bash
kubectl get pods -l app=backend -n trombiflow
```
```
NAME                       READY   STATUS    RESTARTS   AGE
backend-78945bd5f4-4k5m9   1/1     Running   0          10m
backend-78945bd5f4-8f9jx   1/1     Running   0          10m
```

**Étape 2 — Supprimer un pod**
```bash
kubectl delete pod backend-78945bd5f4-4k5m9 -n trombiflow
```

**Étape 3 — Observer le comportement du cluster**
```bash
# Dans un autre terminal, observer en temps réel
kubectl get pods -n trombiflow -w
```

**Résultat attendu** :
```
NAME                       READY   STATUS        RESTARTS   AGE
backend-78945bd5f4-4k5m9   1/1     Terminating   0          10m
backend-78945bd5f4-8f9jx   1/1     Running       0          10m
backend-78945bd5f4-x9k2m   0/1     Pending       0          1s
backend-78945bd5f4-x9k2m   0/1     ContainerCreating   0   2s
backend-78945bd5f4-x9k2m   1/1     Running       0          8s
backend-78945bd5f4-4k5m9   0/0     Terminating   0          10m
```

**Explication du comportement Kubernetes** :

Kubernetes gère ce qu'on appelle une "boucle de réconciliation" : il compare en permanence l'état désiré (2 replicas définis dans le Deployment) avec l'état réel (1 replica après la suppression). Quand il détecte un écart, il agit immédiatement pour corriger la situation. C'est le Deployment Controller qui se charge de créer le nouveau pod.

---

### 7.2 — Vérification de la continuité de service

**Objectif** : Prouver que l'application reste accessible pendant la recréation d'un pod.

Pendant la suppression du pod (étape 2 ci-dessus), vérifier en parallèle :

```bash
# Dans un terminal séparé, boucle de requêtes
while true; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)
  echo "$(date '+%H:%M:%S') → HTTP $STATUS"
  sleep 1
done
```

**Résultat attendu** :
```
15:30:01 → HTTP 200
15:30:02 → HTTP 200
15:30:03 → HTTP 200   ← pod en cours de suppression
15:30:04 → HTTP 200   ← l'autre pod backend répond
15:30:05 → HTTP 200
```

**Résultat attendu** : Toutes les requêtes renvoient 200, y compris pendant la phase de suppression/recréation.

**Pourquoi ça fonctionne** : Grâce à la configuration `maxUnavailable: 0` dans le RollingUpdate, Kubernetes garantit qu'il ne supprime un pod que quand le nouveau est prêt. Le Service Kubernetes gère automatiquement le load balancing vers les pods disponibles. Le pod supprimé n'est plus dans les endpoints du service dès qu'il commence à se terminer.

**Intérêt métier** : En production scolaire, si un administrateur génère un trombinoscope pendant qu'un pod est en cours de recréation, la requête est servie par l'autre pod. Aucune interruption visible pour l'utilisateur.

---

### 7.3 — Vérification du nombre de replicas

**Objectif** : Confirmer que Kubernetes maintient toujours le nombre de replicas demandé.

```bash
# Vérifier l'état du Deployment
kubectl describe deployment backend -n trombiflow | grep -A5 "Replicas:"
```

**Résultat attendu** :
```
Replicas:               2 desired | 2 updated | 2 total | 2 available | 0 unavailable
```

```bash
# Essayer de passer à 0 replicas manuellement
kubectl scale deployment backend --replicas=0 -n trombiflow

# Observer
kubectl get pods -l app=backend -n trombiflow
# → Aucun pod (No resources found)

# Remettre à 2
kubectl scale deployment backend --replicas=2 -n trombiflow

# Observer la recréation
kubectl get pods -l app=backend -n trombiflow -w
```

**Résultat attendu** : Les 2 pods se recréent en moins de 30 secondes.

---

## 8. Tests de montée en charge

### 8.1 — Scaling manuel

**Objectif** : Augmenter manuellement le nombre d'instances du backend pour gérer plus de charge.

```bash
# Passer de 2 à 4 replicas
kubectl scale deployment backend --replicas=4 -n trombiflow

# Observer le scaling
kubectl get pods -l app=backend -n trombiflow -w
```

**Résultat attendu** :
```
NAME                       READY   STATUS              AGE
backend-78945bd-4k5m9      1/1     Running             15m
backend-78945bd-8f9jx      1/1     Running             15m
backend-78945bd-new1x      0/1     ContainerCreating   2s
backend-78945bd-new2y      0/1     ContainerCreating   2s
backend-78945bd-new1x      1/1     Running             8s
backend-78945bd-new2y      1/1     Running             9s
```

**Retour à la configuration initiale** :
```bash
kubectl scale deployment backend --replicas=2 -n trombiflow
```

---

### 8.2 — Le HPA (Horizontal Pod Autoscaler)

Le HPA est un mécanisme Kubernetes qui augmente ou diminue automatiquement le nombre de pods en fonction de l'utilisation des ressources (CPU, mémoire).

**Configuration dans TrombiFlow** (`k8s/hpa.yaml`) :
- Backend : min 2 replicas, max 6 replicas, seuil 70% CPU
- Frontend : min 2 replicas, max 6 replicas, seuil 70% CPU

```bash
# Voir l'état du HPA
kubectl get hpa -n trombiflow
kubectl describe hpa backend-hpa -n trombiflow
```

**Sortie de `describe hpa`** :
```
Name:                     backend-hpa
Namespace:                trombiflow
ScaleTargetRef:           Deployment/backend
MinReplicas:              2
MaxReplicas:              6
Current CPU Utilization:  5%
Desired Replicas:         2
Current Replicas:         2
Conditions:
  Type     Status  Reason  Message
  ----     ------  ------  -------
  AbleToScale  True  ReadyForNewScale  ...
  ScalingActive True  ValidMetricFound  the HPA was able to compute a desired replica count from ...
```

**Simuler de la charge pour déclencher le HPA** :
```bash
# Lancer un générateur de charge
kubectl run load-test --image=busybox --restart=Never -n trombiflow \
  -- /bin/sh -c "while true; do wget -q -O- http://backend:8000/health; done"

# Observer le scaling automatique (attendre 1-2 minutes)
kubectl get hpa backend-hpa -n trombiflow -w

# Arrêter la charge
kubectl delete pod load-test -n trombiflow

# Observer le scale-down (peut prendre 5 minutes)
kubectl get hpa backend-hpa -n trombiflow -w
```

**Interpréter les résultats** :
- Si CPU > 70% : le HPA crée des pods supplémentaires (jusqu'à 6)
- Si CPU < 70% depuis 5 minutes : le HPA supprime des pods (jusqu'à 2 minimum)
- `<unknown>/70%` : le metrics-server n'est pas disponible, le HPA ne peut pas fonctionner

**Pourquoi le HPA est important** : En période de soutenance ou de remise des résultats, de nombreux professeurs peuvent se connecter simultanément pour générer des trombinoscopes. Le HPA permet d'absorber ce pic de charge automatiquement sans intervention manuelle.

---

## 9. Procédure de rollback

### 9.1 — Rollback Docker Compose

**Scénario** : Une nouvelle version du backend est déployée et provoque des erreurs.

```bash
# Vérifier les images disponibles
docker images | grep trombiflow-web

# Revenir à une version précédente (si elle est taguée)
# Modifier le docker-compose.yml pour pointer sur l'ancienne image
# Puis :
docker compose down
docker compose up -d

# Alternative : rollback en spécifiant l'image directement
docker compose -f docker-compose.prod.yml up -d \
  --scale web=0 && \
IMAGE_TAG=sha_precedent docker compose -f docker-compose.prod.yml up -d
```

---

### 9.2 — Rollback Kubernetes

Kubernetes conserve l'historique des déploiements. Un rollback peut se faire en une commande.

**Étape 1 — Voir l'historique des révisions**
```bash
kubectl rollout history deployment/backend -n trombiflow
```

**Résultat attendu** :
```
REVISION  CHANGE-CAUSE
1         <none>
2         <none>
3         <none>
```

**Étape 2 — Voir le détail d'une révision**
```bash
kubectl rollout history deployment/backend -n trombiflow --revision=2
```

**Étape 3 — Revenir à la révision précédente**
```bash
kubectl rollout undo deployment/backend -n trombiflow
```

**Résultat attendu** :
```
deployment.apps/backend rolled back
```

**Étape 4 — Suivre le rollback**
```bash
kubectl rollout status deployment/backend -n trombiflow
```

**Résultat attendu** :
```
Waiting for deployment "backend" rollout to finish: 1 out of 2 new replicas have been updated...
Waiting for deployment "backend" rollout to finish: 2 out of 2 new replicas have been updated...
deployment "backend" successfully rolled out
```

**Étape 5 — Vérifier que l'ancienne image est revenue**
```bash
kubectl get pods -l app=backend -n trombiflow \
  -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[0].image}{"\n"}{end}'
```

**Revenir à une révision spécifique** :
```bash
kubectl rollout undo deployment/backend -n trombiflow --to-revision=1
```

**Rollback du frontend** :
```bash
kubectl rollout undo deployment/frontend -n trombiflow
kubectl rollout status deployment/frontend -n trombiflow
```

---

### 9.3 — Vérification post-rollback

```bash
# L'application répond correctement ?
curl http://localhost:8000/health

# Les pods sont dans un état stable ?
kubectl get pods -n trombiflow

# Pas de restart en boucle ?
kubectl get pods -n trombiflow | grep -v "0" | grep RESTARTS
```

---

## 10. Préparation à la soutenance

### Ce que je peux démontrer devant le jury

Voici le script exact à exécuter dans l'ordre pour une démo fluide.

---

#### Bloc 1 — Docker (2 minutes)

```bash
# Montrer les Dockerfiles
cat backend/Dockerfile | head -30

# Construire l'image backend
docker build -t trombiflow-backend:demo ./backend

# Montrer le multi-stage et la taille
docker images | grep trombiflow

# Montrer l'utilisateur non-root
docker run --rm trombiflow-backend:demo whoami
# → appuser
```

**Ce que je dis** : "J'ai utilisé un build multi-stage pour avoir une image légère en production. La première étape installe toutes les dépendances, la deuxième ne copie que le strict nécessaire. L'application tourne en tant qu'utilisateur `appuser` et non root, ce qui réduit la surface d'attaque."

---

#### Bloc 2 — Docker Compose (2 minutes)

```bash
# Démarrer toute la stack
docker compose up -d

# Voir les conteneurs
docker compose ps

# Vérifier l'API
curl http://localhost:8000/health
# → {"status": "ok"}

# Voir les logs du démarrage (migrations)
docker compose logs web --tail=15
```

**Ce que je dis** : "Avec une seule commande, on démarre 4 services : la base de données, MinIO pour le stockage des fichiers, le backend et le frontend. Le backend attend que la BDD soit prête avant de démarrer, grâce au healthcheck."

---

#### Bloc 3 — CI/CD GitHub Actions (2 minutes)

```bash
# Montrer le pipeline
cat .github/workflows/ci.yml

# Montrer les résultats en ligne
gh run list --workflow=ci.yml --limit=3

# Montrer le check-versions
bash scripts/check-versions.sh
```

**Ce que je dis** : "À chaque push, le pipeline vérifie que les dépendances sont épinglées, lance les tests backend, vérifie le formatage du code avec Black et Flake8, puis construit et pousse les images Docker sur GHCR avec le SHA du commit comme tag."

---

#### Bloc 4 — Test fonctionnel complet (3 minutes)

```bash
# Créer un compte
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","email":"demo@school.fr","password":"Demo1234!"}'

# Se connecter et récupérer le token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@school.fr","password":"Demo1234!"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Créer une classe
curl -X POST http://localhost:8000/api/classes/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"label":"Terminale SIO","year":"2025-2026"}'

# Créer un étudiant
curl -X POST http://localhost:8000/api/students/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Jean","last_name":"Dupont","email":"jean@school.fr","class_id":1}'

# Générer le trombinoscope HTML
curl -o /dev/null -s -w "Status: %{http_code}\n" \
  "http://localhost:8000/api/trombi/?format=html&class_id=1" \
  -H "Authorization: Bearer $TOKEN"
# → Status: 200
```

---

#### Bloc 5 — Kubernetes — Résilience (3 minutes)

```bash
# Afficher les pods
kubectl get pods -n trombiflow

# Supprimer un pod
POD=$(kubectl get pod -l app=backend -n trombiflow -o jsonpath='{.items[0].metadata.name}')
kubectl delete pod $POD -n trombiflow

# Observer la recréation automatique
kubectl get pods -n trombiflow -w
```

**Ce que je dis** : "Je viens de supprimer un pod backend. Kubernetes détecte immédiatement que l'état réel (1 pod) ne correspond plus à l'état désiré (2 pods). Il recrée automatiquement un pod en moins de 30 secondes. Pendant ce temps, le deuxième pod continue de servir les requêtes."

---

#### Bloc 6 — Kubernetes — Rolling Update (2 minutes)

```bash
# Simuler un déploiement d'une nouvelle version
kubectl set image deployment/backend \
  backend=ghcr.io/babakam870/trombiflow/backend:latest \
  -n trombiflow

# Suivre le rolling update
kubectl rollout status deployment/backend -n trombiflow
```

---

#### Bloc 7 — Kubernetes — Rollback (1 minute)

```bash
# Voir l'historique
kubectl rollout history deployment/backend -n trombiflow

# Rollback
kubectl rollout undo deployment/backend -n trombiflow

# Vérifier
kubectl rollout status deployment/backend -n trombiflow
```

**Ce que je dis** : "En cas de problème avec une nouvelle version, je peux revenir à la version précédente en une seule commande. Le rollback se fait via le même mécanisme de rolling update : les anciens pods sont recréés progressivement pendant que les nouveaux sont supprimés."

---

#### Bloc 8 — Kubernetes — Scaling (1 minute)

```bash
# Scale up
kubectl scale deployment backend --replicas=4 -n trombiflow
kubectl get pods -l app=backend -n trombiflow -w

# Scale down
kubectl scale deployment backend --replicas=2 -n trombiflow
```

---

## 11. Questions possibles du jury

### Questions sur Docker

**Q1. Pourquoi utiliser un build multi-stage dans votre Dockerfile backend ?**

Le build multi-stage permet d'avoir une image de production légère. La première étape (builder) installe toutes les dépendances de compilation, notamment pip et les headers C nécessaires à certains packages Python. La deuxième étape (runtime) ne copie que les packages Python compilés, sans les outils de build. Résultat : une image plus petite, donc plus rapide à télécharger et avec moins de vulnérabilités potentielles.

*Piège à éviter* : Ne pas dire "c'est pour que ça marche mieux" sans expliquer le mécanisme concret.

---

**Q2. Pourquoi votre image tourne-t-elle en tant qu'utilisateur `appuser` et non en root ?**

C'est une mesure de sécurité. Si un attaquant exploite une vulnérabilité dans l'application et prend le contrôle du conteneur, il n'aura que les droits de `appuser`, pas les droits root. Avec Docker, un conteneur root peut, dans certaines configurations, escalader vers les droits root de l'hôte. C'est pourquoi les bonnes pratiques recommandent toujours d'utiliser un utilisateur non-privilégié.

---

**Q3. Qu'est-ce que le `.dockerignore` et pourquoi est-il important ?**

Le `.dockerignore` liste les fichiers et dossiers à exclure du contexte de build Docker. Sans lui, Docker enverrait l'intégralité du dossier au daemon, incluant `node_modules`, `.git`, `.env` (qui contient des secrets), `__pycache__`, etc. Ça ralentirait le build et pourrait intégrer des données sensibles dans l'image. Notre `.dockerignore` exclut notamment `.env`, `.venv`, `__pycache__` et `node_modules`.

---

**Q4. Quelle est la différence entre `CMD` et `ENTRYPOINT` dans un Dockerfile ?**

`ENTRYPOINT` définit l'exécutable principal du conteneur, qui ne peut pas être remplacé facilement lors du `docker run`. `CMD` fournit les arguments par défaut à cet exécutable, et peut être remplacé. Dans notre Dockerfile backend, `ENTRYPOINT` est `/usr/bin/tini` (le gestionnaire de processus init) et `CMD` est `sh ./entrypoint.sh`. Tini est utilisé pour une gestion correcte des signaux (SIGTERM, SIGINT) et pour éviter les processus zombies.

---

### Questions sur Docker Compose

**Q5. Pourquoi avez-vous deux fichiers docker-compose (dev et prod) ?**

Les besoins en développement et en production sont différents. En développement, on veut un démarrage rapide, des logs visibles, les ports exposés pour débugger. En production, on veut la sécurité maximale : fichiers systèmes en lecture seule (`read_only: true`), capabilities Linux droppées (`cap_drop: ALL`), aucun nouveau privilège (`no-new-privileges: true`), réseau interne pour le backend, variables d'environnement obligatoires avec fail-fast si elles manquent.

---

**Q6. Qu'est-ce que `depends_on: condition: service_healthy` et pourquoi l'avez-vous utilisé ?**

C'est une dépendance conditionnelle. Le service backend ne démarrera que quand le service `db` sera considéré "healthy", c'est-à-dire quand son `healthcheck` retournera succès. Le healthcheck de PostgreSQL exécute `pg_isready` pour vérifier que la base est prête à accepter des connexions. Sans ça, le backend pourrait démarrer avant PostgreSQL et planter en essayant de se connecter.

---

**Q7. Pourquoi les données de la base de données persistent-elles entre les redémarrages ?**

Les données persistent grâce aux volumes Docker nommés. Dans `docker-compose.yml`, on déclare `volumes: db_data:/var/lib/postgresql/data`. Docker crée un volume sur le système hôte et le monte à cet emplacement dans le conteneur. Même si le conteneur est arrêté et supprimé, le volume existe toujours. Les données ne sont effacées que si on fait `docker compose down -v` (avec le flag `-v`).

---

### Questions sur GitHub Actions

**Q8. Décrivez le pipeline CI/CD que vous avez mis en place.**

Le pipeline se compose de 5 jobs :
1. `check-versions` : vérifie que toutes les dépendances Python sont épinglées à une version précise
2. `test-backend` : installe les dépendances, vérifie le formatage avec Black, le style avec Flake8, puis lance pytest
3. `test-frontend` : vérifie le linting et lance les tests frontend
4. `build` : construit les images Docker backend et frontend, puis les pousse sur GHCR avec le SHA du commit comme tag
5. `deploy` : se connecte au serveur de production via SSH et lance `docker compose pull && up -d`

Les jobs 2, 3 et 4 sont dans l'ordre : `build` ne s'exécute que si les deux jobs de test réussissent.

---

**Q9. Pourquoi tagguer les images avec le SHA du commit plutôt qu'avec un numéro de version ?**

Le SHA du commit est unique et immuable. Il permet de tracer exactement quel code source a produit quelle image. Si un bug est introduit, on peut retrouver précisément à quel commit il a été introduit, et on peut rollback vers n'importe quelle version précédente. Un tag `latest` ou `v1.2` est ambigu et peut pointer vers des contenus différents dans le temps.

---

**Q10. Que se passe-t-il si un test échoue dans le pipeline ?**

Le job `test-backend` ou `test-frontend` se marque comme échoué (`failure`). Le job `build` a `needs: [test-backend, test-frontend]` donc il ne s'exécute pas. Aucune image n'est construite, aucune image n'est poussée sur GHCR, aucun déploiement n'a lieu. C'est l'intérêt du CI : le code cassé ne peut pas partir en production.

*Piège à éviter* : Ne pas confondre "le pipeline échoue" avec "l'application est en panne". Le code de production en cours d'exécution n'est pas touché.

---

### Questions sur Kubernetes

**Q11. Quelle est la différence entre un Pod et un Deployment ?**

Un Pod est l'unité de base de Kubernetes : c'est un ou plusieurs conteneurs qui partagent le réseau et le stockage. Si un Pod plante, il n'est pas recréé automatiquement.

Un Deployment gère un ensemble de Pods identiques (les réplicas). Il surveille que le nombre de Pods actifs correspond au nombre désiré. Si un Pod plante, le Deployment Controller en crée un nouveau. C'est pour ça qu'on ne crée jamais de Pods directement en production, mais toujours via des Deployments.

---

**Q12. Qu'est-ce qu'un Service Kubernetes et pourquoi en a-t-on besoin ?**

Les Pods ont des adresses IP qui changent à chaque recréation. Un Service Kubernetes fournit une adresse IP et un nom DNS stables qui pointent toujours vers les Pods actifs correspondant à son sélecteur (`app: backend` par exemple). Quand le backend doit appeler PostgreSQL, il utilise le nom `postgres`, pas une IP. Le Service fait le load balancing entre les Pods disponibles.

---

**Q13. Expliquez la différence entre un StatefulSet et un Deployment.**

Un Deployment est adapté aux applications sans état (stateless) : les Pods sont interchangeables, ils peuvent démarrer dans n'importe quel ordre. Un StatefulSet est fait pour les applications avec état (stateful) comme les bases de données : les Pods ont une identité stable (postgres-0, postgres-1...), un volume persistant dédié à chacun, et ils démarrent/s'arrêtent dans un ordre défini. On utilise un StatefulSet pour PostgreSQL car la base de données ne peut pas avoir deux instances qui écrivent simultanément sur les mêmes données.

---

**Q14. Qu'est-ce qu'un HPA et comment fonctionne-t-il ?**

Le HPA (Horizontal Pod Autoscaler) est un mécanisme Kubernetes qui ajuste automatiquement le nombre de replicas d'un Deployment en fonction de métriques (CPU, mémoire). Dans TrombiFlow, on a configuré un seuil de 70% CPU : si la moyenne CPU des pods backend dépasse 70%, le HPA crée des pods supplémentaires (jusqu'à 6). Si la charge diminue, il réduit progressivement le nombre de pods (jusqu'à 2 minimum). Le HPA nécessite le metrics-server pour fonctionner.

---

**Q15. Expliquez ce qu'est une NetworkPolicy.**

Une NetworkPolicy est une règle de pare-feu au niveau Kubernetes. Elle définit quels pods peuvent communiquer avec quels autres pods. Dans TrombiFlow, on a défini : seul le frontend peut appeler le backend sur le port 8000, seul le backend peut appeler PostgreSQL sur le port 5432, et seul le backend peut appeler MinIO sur le port 9000. Sans ces règles, n'importe quel pod du namespace pourrait appeler n'importe quel autre.

---

**Q16. Quelle est la différence entre un ConfigMap et un Secret ?**

Les deux stockent des configurations, mais avec des niveaux de protection différents. Les ConfigMaps stockent des données non-sensibles (port, type de stockage, niveau de log). Les Secrets stockent des données sensibles (mot de passe BDD, clé JWT, identifiants MinIO). Les Secrets sont encodés en base64 (ce n'est pas du chiffrement) et peuvent être chiffrés au niveau d'etcd. Dans TrombiFlow, `DATABASE_URL` et `JWT_SECRET` sont dans un Secret, `PORT` et `STORAGE_TYPE` sont dans un ConfigMap.

---

**Q17. Qu'est-ce qu'un Ingress et comment l'avez-vous configuré ?**

Un Ingress est un point d'entrée HTTP/HTTPS pour le cluster Kubernetes. Il reçoit les requêtes web et les redirige vers les Services appropriés selon le chemin de l'URL. Dans TrombiFlow, l'Ingress redirige toutes les requêtes vers le Service frontend (qui lui-même proxifie `/api` vers le backend via sa configuration Nginx). L'hôte configuré est `trombiflow.local` pour les tests locaux.

---

**Q18. Qu'est-ce qu'un Rolling Update et pourquoi est-ce important ?**

Un Rolling Update est une stratégie de déploiement Kubernetes qui met à jour les pods progressivement, un par un (ou par groupe), plutôt que de tout arrêter et redémarrer en même temps. Avec `maxUnavailable: 0`, Kubernetes garantit qu'il y a toujours au moins 2 pods disponibles pendant la mise à jour. Résultat : aucune interruption de service lors d'un déploiement. C'est crucial en production où les utilisateurs ne doivent pas voir de coupure.

---

**Q19. Pourquoi avoir un PersistentVolumeClaim pour PostgreSQL plutôt qu'un volume emptyDir ?**

Un `emptyDir` est un volume temporaire : il existe tant que le Pod existe. Si le Pod est supprimé (restart, mise à jour), les données sont perdues. Un `PersistentVolumeClaim` provisionne un volume de stockage persistant indépendant du cycle de vie du Pod. Même si le pod postgres-0 est supprimé et recréé, le nouveau pod postgres-0 du StatefulSet retrouvera les mêmes données.

---

**Q20. Comment avez-vous géré la sécurité des conteneurs dans Kubernetes ?**

Plusieurs couches de sécurité ont été configurées dans les SecurityContexts :
- `runAsNonRoot: true` et `runAsUser: 1000` : le conteneur ne peut pas tourner en root
- `readOnlyRootFilesystem: true` : le conteneur ne peut pas modifier son système de fichiers (sauf les volumes montés)
- `allowPrivilegeEscalation: false` : le processus ne peut pas obtenir plus de droits que ceux du conteneur
- `capabilities: drop: ["ALL"]` : toutes les capabilities Linux sont retirées

Pour les données sensibles, elles sont stockées dans des Secrets Kubernetes et injectées comme variables d'environnement, jamais en clair dans les manifests.

---

## 12. Analyse finale

### Tableau de conformité

| Fonctionnalité DevOps | Conforme | Commentaire |
|---|:---:|---|
| Dockerfile backend (multi-stage, non-root, tini) | ✅ | Production-ready |
| Dockerfile frontend (build Vite → Nginx) | ✅ | Healthcheck inclus |
| docker-compose.yml dev (4 services, volumes, healthcheck) | ✅ | `docker compose up -d` fonctionnel |
| docker-compose.prod.yml (sécurité renforcée) | ✅ | read_only, cap_drop, no-new-privileges |
| `.env.example` complet | ✅ | Toutes les variables documentées |
| `.env` de démo fonctionnel | ✅ | Corrigé, testé |
| Pipeline CI/CD GitHub Actions | ✅ | 5 jobs : check → test → build → push → deploy |
| `check-versions.sh` (dépendances épinglées) | ✅ | Passe avec boto3 épinglé |
| Tests backend (pytest, 34/35) | ✅ | 1 test upload buggé côté équipe backend |
| Linting Python (Black + Flake8) | ✅ | Intégré dans la CI |
| Build images Docker (backend + frontend) | ✅ | Multi-platform, cache GHA |
| Push GHCR avec tag SHA | ✅ | Traçabilité des versions |
| Tag `:latest` poussé | ⚠️ | À ajouter dans `build-push-action` |
| Job deploy actif | ⚠️ | `DEPLOY_ENABLED: false` — à activer |
| Tests frontend (vitest) | ❌ | Aucun script test dans `package.json` |
| Endpoint `/health` backend | ✅ | Ajouté, utilisé par les probes K8s |
| Namespace Kubernetes dédié | ✅ | `trombiflow` |
| StatefulSet PostgreSQL + tmpfs | ✅ | Corrigé |
| Deployments backend + frontend (2 replicas) | ✅ | RollingUpdate zero-downtime |
| Services ClusterIP | ✅ | DNS interne fonctionnel |
| Ingress avec routing cohérent | ✅ | Route directe /api supprimée |
| ConfigMap + Secret séparés | ✅ | Données sensibles isolées |
| HPA backend + frontend | ✅ | autoscaling/v2, seuil 70% CPU |
| Resource requests + limits | ✅ | Sur tous les containers |
| Readiness + liveness probes sur `/health` | ✅ | Corrigé |
| SecurityContext complet | ✅ | Non-root, readOnly, no escalation |
| NetworkPolicy (backend, postgres, minio) | ✅ | Corrigé, règle minio ajoutée |
| PodAntiAffinity | ✅ | Pods distribués sur des nœuds différents |
| PersistentVolumeClaims | ✅ | PostgreSQL 10 Go, MinIO 10 Go |
| Kustomize fonctionnel | ✅ | configMapGenerator invalide supprimé |
| Script `deploy.sh` | ✅ | Opérationnel avec gestion d'erreurs |
| README.md (setup, env, commandes) | ⚠️ | Erreurs : PDF engine, commandes tests |
| Guide déploiement Kubernetes | ✅ | `k8s/README.md` complet |

---

### Ce qui est terminé

La majorité de la partie DevOps est terminée et fonctionnelle. Le projet peut être lancé avec `docker compose up -d`, tous les services démarrent correctement, l'API répond, les tests backend passent (34/35), la CI build et pousse les images sur GHCR, les manifests Kubernetes couvrent l'ensemble de la stack avec des configurations de sécurité correctes.

---

### Ce qui reste à faire

**Avant la soutenance (priorité haute)** :

1. **Activer le deploy job** dans `ci.yml` — changer `DEPLOY_ENABLED: false` en `true` et configurer les secrets `SSH_HOST`, `SSH_USER`, `SSH_KEY` dans GitHub → Settings → Secrets. Alternativement, déployer sur une plateforme cloud (Render, Fly.io) et documenter l'URL.

2. **Ajouter les tests frontend** — ajouter `vitest` dans `package.json` et écrire au moins un test de formulaire. Le job `test-frontend` passe actuellement sans rien tester.

3. **Corriger le README** — remplacer "WeasyPrint/wkhtmltopdf" par "ReportLab" dans le tableau de stack technique, et corriger la commande de test backend de `npm test` à `python -m pytest tests/`.

**Améliorations supplémentaires** :

4. Ajouter le tag `:latest` dans `build-push-action` pour la cohérence avec les manifests K8s.
5. Créer le secret `imagePullSecrets` pour GHCR dans les manifests Kubernetes.
6. Supprimer le doublon du cache pip dans `ci.yml`.

---

### Les points les plus valorisants à montrer pendant la soutenance

**1. La démonstration de résilience Kubernetes** : Supprimer un pod en direct et montrer qu'il est recréé automatiquement sans interruption de service. C'est visuel, impressionnant et concret.

**2. Le pipeline CI/CD complet** : Faire un `git push` et montrer en direct l'exécution des 5 jobs sur GitHub Actions, se terminant par une image sur GHCR.

**3. Le rolling update** : Déployer une nouvelle version et montrer que le service reste accessible pendant toute la durée du déploiement.

**4. La sécurité des conteneurs** : Montrer que les conteneurs tournent en non-root (`docker compose exec web whoami → appuser`), que les données sensibles sont dans des Secrets Kubernetes, et que les NetworkPolicies isolent les services.

**5. L'infrastructure as code** : Présenter les 12 fichiers YAML Kubernetes qui décrivent l'intégralité de l'infrastructure de manière déclarative, versionnable et reproductible.

---

*Ce document est à jour avec les corrections appliquées lors de l'analyse du dépôt le 14 juin 2026.*
