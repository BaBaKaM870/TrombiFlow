# 🚀 Déploiement Kubernetes — TrombiFlow

Guide complet pour déployer TrombiFlow en production sur Kubernetes avec les images depuis GitHub Container Registry (GHCR).

---

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Structure des manifests](#structure-des-manifests)
3. [Configuration des secrets](#configuration-des-secrets)
4. [Déploiement](#déploiement)
5. [Vérification](#vérification)
6. [Mise à jour des images](#mise-à-jour-des-images)
7. [Troubleshooting](#troubleshooting)

---

## 📌 Prérequis

- **Cluster Kubernetes** (1.24+) en fonctionnement
- **kubectl** configuré pour accéder au cluster
- **GHCR access** : Si les images sont privées, configurer un `ImagePullSecret`
- **StorageClass** : Vérifier que `standard` existe (ou adapter les PVCs)

### Vérifier votre cluster

```bash
kubectl version --client
kubectl cluster-info
kubectl get storageclass
```

---

## 📂 Structure des manifests

```
k8s/
├── namespace.yaml          # Namespace trombiflow
├── serviceaccount.yaml     # ServiceAccount + RBAC
├── configmap.yaml          # ConfigMap (variables non-sensibles)
├── secret.example.yaml     # Template Secret (⚠️ À dupliquer et adapter)
├── postgres.yaml           # Deployment + Service PostgreSQL
├── backend.yaml            # Deployment + Service + PVC Backend
├── frontend.yaml           # Deployment + Service Frontend
├── ingress.yaml            # Ingress Controller (routing HTTP)
├── hpa.yaml                # Horizontal Pod Autoscaler
├── networkpolicy.yaml      # Network Policies (sécurité)
└── README.md               # Ce fichier
```

---

## 🔐 Configuration des secrets

### ⚠️ IMPORTANT : Gestion sécurisée des secrets

Le fichier `secret.example.yaml` est un **template**. Il ne doit jamais contenir de vrais secrets.

### Option 1 : Secrets manuels (simple, pour dev/test)

```bash
# 1. Copier le template
cp k8s/secret.example.yaml k8s/secret.yaml

# 2. Éditer le fichier avec vos vrais secrets
nano k8s/secret.yaml

# 3. Ajouter secret.yaml au .gitignore (s'il n'y est pas)
echo "k8s/secret.yaml" >> .gitignore

# 4. Créer le secret dans le cluster
kubectl apply -f k8s/secret.yaml
```

### Option 2 : Secrets via variables d'environnement (recommandé)

```bash
# Générer des secrets forts
DB_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

# Créer le secret Kubernetes directement
kubectl create secret generic trombiflow-secrets \
  -n trombiflow \
  --from-literal=DATABASE_URL="postgresql://trombiflow:${DB_PASSWORD}@postgres:5432/trombiflow" \
  --from-literal=JWT_SECRET="${JWT_SECRET}" \
  --from-literal=POSTGRES_DB=trombiflow \
  --from-literal=POSTGRES_USER=trombiflow \
  --from-literal=POSTGRES_PASSWORD="${DB_PASSWORD}" \
  --from-literal=S3_BUCKET=trombiflow \
  --from-literal=S3_ENDPOINT="https://your_project_ref.supabase.co/storage/v1/s3" \
  --from-literal=S3_KEY="SUPABASE_ACCESS_KEY" \
  --from-literal=S3_SECRET="SUPABASE_SECRET_KEY"
```

### Option 3 : Sealed Secrets (production recommandée)

Pour une gestion GitOps sécurisée :

```bash
# Installer Sealed Secrets operator
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.18.0/controller.yaml

# Créer un secret scellé
kubectl create secret generic trombiflow-secrets \
  --from-literal=POSTGRES_PASSWORD=... \
  --from-literal=JWT_SECRET=... \
  -n trombiflow \
  --dry-run=client -o yaml | kubeseal -o yaml > k8s/secret-sealed.yaml

# Appliquer le secret scellé (peut être commité)
kubectl apply -f k8s/secret-sealed.yaml
```

---

## 🚀 Déploiement

### Étape 1 : Créer le namespace et les comptes de service

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/serviceaccount.yaml
```

### Étape 2 : Créer la ConfigMap

```bash
kubectl apply -f k8s/configmap.yaml
```

### Étape 3 : Créer les secrets

Choisir l'une des options ci-dessus (Manuel, Variables, ou Sealed Secrets).

### Étape 4 : Déployer la base de données

```bash
kubectl apply -f k8s/postgres.yaml
```

Attendre que le pod soit prêt :

```bash
kubectl wait --for=condition=ready pod \
  -l app=postgres \
  -n trombiflow \
  --timeout=300s
```

### Étape 5 : Déployer le backend et frontend

```bash
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
```

### Étape 6 : Configurer l'accès réseau

```bash
# NetworkPolicies (sécurité)
kubectl apply -f k8s/networkpolicy.yaml

# Ingress Controller (si NGINX Ingress Controller est installé)
kubectl apply -f k8s/ingress.yaml

# Autoscaling (optionnel)
kubectl apply -f k8s/hpa.yaml
```

### 🎯 Déploiement complet en une commande

```bash
kubectl apply -f k8s/
```

---

## ✅ Vérification du déploiement

### 1. Vérifier tous les pods

```bash
kubectl get pods -n trombiflow
```

Output attendu :

```
NAME                        READY   STATUS    RESTARTS   AGE
backend-78945bd5f4-4k5m9    1/1     Running   0          2m
backend-78945bd5f4-8f9jx    1/1     Running   0          2m
frontend-5d6c7e4f9-2k3m1    1/1     Running   0          2m
frontend-5d6c7e4f9-9l2p8    1/1     Running   0          2m
postgres-5d6f7d9c8-x4k2n    1/1     Running   0          3m
```

### 2. Vérifier les services

```bash
kubectl get svc -n trombiflow
```

### 3. Vérifier les PersistentVolumes

```bash
kubectl get pvc -n trombiflow
```

### 4. Accéder à l'application

#### Via Ingress (si NGINX est configuré)

```bash
# Ajouter une entrée locale /etc/hosts
echo "127.0.0.1 trombiflow.local" >> /etc/hosts

# Ouvrir le navigateur
curl http://trombiflow.local
```

#### Via Port-Forward (pour tester)

```bash
# Frontend
kubectl port-forward -n trombiflow svc/frontend 5173:80

# Backend
kubectl port-forward -n trombiflow svc/backend 8000:8000

```

### 5. Vérifier les logs

```bash
# Backend logs
kubectl logs -n trombiflow -l app=backend --tail=50 -f

# Frontend logs
kubectl logs -n trombiflow -l app=frontend --tail=50 -f

# PostgreSQL logs
kubectl logs -n trombiflow -l app=postgres --tail=50 -f
```

---

## 🖼️ Mise à jour des images

### Mettre à jour une image depuis GHCR

Les images sont référencées avec le tag `latest` :

```yaml
image: ghcr.io/babakam870/trombiflow/backend:latest
```

Pour déployer une version spécifique (par exemple, depuis CI/CD) :

```bash
# Méthode 1 : Éditer les manifests
# Dans backend.yaml et frontend.yaml, changer:
# image: ghcr.io/babakam870/trombiflow/backend:latest
# Par:
# image: ghcr.io/babakam870/trombiflow/backend:<COMMIT_SHA>

# Méthode 2 : Set l'image via kubectl
kubectl set image deployment/backend \
  -n trombiflow \
  backend=ghcr.io/babakam870/trombiflow/backend:abc123def456

kubectl set image deployment/frontend \
  -n trombiflow \
  frontend=ghcr.io/babakam870/trombiflow/frontend:abc123def456
```

### Forcer le pull de la dernière image

```bash
kubectl rollout restart deployment/backend -n trombiflow
kubectl rollout restart deployment/frontend -n trombiflow
```

---

## 🔍 Troubleshooting

### Les pods ne démarrent pas

```bash
# Voir les détails du pod
kubectl describe pod <POD_NAME> -n trombiflow

# Voir les logs
kubectl logs <POD_NAME> -n trombiflow
```

### ImagePullBackOff (images privées sur GHCR)

Si vous avez une erreur `ImagePullBackOff`, configurer un secret d'authentification GHCR :

```bash
# Générer un Personal Access Token sur GitHub
# https://github.com/settings/tokens (avec scope `read:packages`)

# Créer le secret d'authentification
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=<USERNAME> \
  --docker-password=<PAT> \
  --docker-email=<EMAIL> \
  -n trombiflow

# Ajouter le secret aux Deployments (dans `spec.imagePullSecrets`)
# imagePullSecrets:
#   - name: ghcr-secret
```

### Les données persistent ne sont pas sauvegardées

```bash
# Vérifier les PVCs
kubectl get pvc -n trombiflow

# Vérifier les PVs
kubectl get pv

# Si aucun PV disponible, créer un PV manuellement ou utiliser
# un StorageClass différent (ex. fast, default)
```

### Postgres refuse la connexion

```bash
# Vérifier les logs PostgreSQL
kubectl logs -n trombiflow -l app=postgres -f

# Vérifier les variables d'environnement
kubectl get secret trombiflow-secrets -n trombiflow -o yaml

# Vérifier la connectivité depuis le backend
kubectl exec -it deployment/backend -n trombiflow -- \
  python -c "import psycopg2; conn = psycopg2.connect('postgresql://...')"
```

## 📊 Monitoring et Scaling

### HorizontalPodAutoscaler

Les fichiers `hpa.yaml` automatisent le scaling basé sur l'utilisation CPU :

```bash
# Voir le status de l'HPA
kubectl get hpa -n trombiflow
kubectl describe hpa backend-hpa -n trombiflow
```

### Métriques (si Prometheus/Grafana est installé)

Le backend expose `/metrics` pour Prometheus.

### Logs centralisés (optionnel)

Intégrer avec ELK Stack, Loki, ou autres solutions de logging.

---

## 🧹 Nettoyage

### Supprimer le déploiement complet

```bash
# Supprimer tous les ressources du namespace
kubectl delete namespace trombiflow

# ⚠️ Cela supprime aussi les données persistent !
# Pour garder les données, supprimer uniquement les deployments/services :
kubectl delete deployment,service -n trombiflow -l app=trombiflow
```

---

## 📚 Ressources supplémentaires

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)

---

**Dernière mise à jour** : Mai 2026
