# DEVOPS_DEMO.md — Fiche de soutenance DevOps
**TrombiFlow — Sofiane CHERIETTE — BTS SIO 2025/2026**

---

## 1. Vérification Docker

**Objectif** : Montrer que les images sont construites et sécurisées.

```bash
docker images | grep trombiflow
docker run --rm trombiflow-web whoami
```

**Résultat attendu** : `appuser`

> *"L'image backend est construite en multi-stage pour être légère. Le conteneur tourne en tant qu'utilisateur non-root, ce qui réduit la surface d'attaque."*

---

## 2. Vérification Docker Compose

**Objectif** : Montrer que la stack démarre en une commande.

```bash
docker compose up -d
docker compose ps
curl http://localhost:8000/health
```

**Résultat attendu** : 4 conteneurs `Up`, réponse `{"status": "ok"}`

> *"Avec une seule commande, on démarre la base de données, MinIO, le backend et le frontend. Le backend attend que la base soit prête avant de démarrer."*

---

## 3. Vérification GitHub Actions

**Objectif** : Montrer le pipeline CI/CD.

```bash
bash scripts/check-versions.sh
gh run list --workflow=ci.yml --limit=3
```

**Résultat attendu** : `✅ All Python dependencies are pinned` — runs avec status `completed`

> *"À chaque push, le pipeline vérifie les dépendances, lance les tests, formate le code, puis build et pousse les images sur GHCR automatiquement."*

---

## 4. Déploiement Kubernetes

**Objectif** : Déployer l'application sur le cluster.

```bash
kubectl apply -f k8s/namespace.yaml
bash k8s/deploy.sh
```

**Résultat attendu** : `namespace/trombiflow created`, manifests appliqués un par un

> *"Tous les composants sont décrits en fichiers YAML versionnés. Une seule commande déploie l'intégralité de l'infrastructure."*

---

## 5. Vérification des Pods

**Objectif** : Confirmer que tous les pods sont Running.

```bash
kubectl get pods -n trombiflow -o wide
kubectl wait --for=condition=ready pod -l app=backend -n trombiflow --timeout=120s
```

**Résultat attendu** : `backend 1/1 Running`, `frontend 1/1 Running`, `postgres-0 1/1 Running`

> *"Chaque service a deux replicas distribués sur des nœuds différents grâce au PodAntiAffinity."*

---

## 6. Vérification des Services

**Objectif** : Montrer la découverte de services et accéder à l'application.

```bash
kubectl get svc -n trombiflow
kubectl port-forward svc/backend 8000:8000 -n trombiflow &
curl http://localhost:8000/health
```

**Résultat attendu** : Services `ClusterIP` listés, réponse `{"status": "ok"}`

> *"Les Services Kubernetes exposent les pods avec un nom DNS stable. Le backend est accessible en interne via son nom de service."*

---

## 7. Test de résilience

**Objectif** : Supprimer un pod et montrer la recréation automatique.

```bash
# Terminal 1 — observer
kubectl get pods -n trombiflow -w

# Terminal 2 — supprimer
POD=$(kubectl get pod -l app=backend -n trombiflow -o jsonpath='{.items[0].metadata.name}')
kubectl delete pod $POD -n trombiflow
```

**Résultat attendu** : Pod passe en `Terminating`, un nouveau pod passe à `Running` en moins de 30 secondes

> *"Kubernetes détecte automatiquement la disparition du pod et recrée une nouvelle instance afin de garantir la disponibilité du service."*

---

## 8. Test de continuité de service

**Objectif** : Prouver que l'API reste accessible pendant la recréation du pod.

```bash
# Terminal 1 — boucle de requêtes
while true; do
  echo "$(date '+%H:%M:%S') → $(curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/health)"
  sleep 1
done

# Terminal 2 — supprimer un pod pendant que la boucle tourne
kubectl delete pod -l app=backend -n trombiflow --grace-period=0
```

**Résultat attendu** : Toutes les réponses restent `200`, aucune interruption visible

> *"Le deuxième replica prend en charge les requêtes pendant que le premier se recrée. Aucune coupure de service pour l'utilisateur."*

---

## 9. Test de scaling

**Objectif** : Ajuster le nombre d'instances à la demande.

```bash
kubectl scale deployment backend --replicas=4 -n trombiflow
kubectl get pods -l app=backend -n trombiflow -w

# Retour à 2
kubectl scale deployment backend --replicas=2 -n trombiflow
```

**Résultat attendu** : 2 nouveaux pods créés en moins de 30 secondes, puis supprimés

> *"Le scaling manuel permet d'absorber un pic de charge en quelques secondes. Le HPA le fait automatiquement dès que le CPU dépasse 70%."*

---

## 10. Vérification HPA

**Objectif** : Montrer la configuration de l'autoscaling.

```bash
kubectl get hpa -n trombiflow
kubectl describe hpa backend-hpa -n trombiflow | grep -E "Min|Max|Current|Targets"
```

**Résultat attendu** :
```
MinReplicas: 2   MaxReplicas: 6   Targets: X%/70%   Replicas: 2
```

> *"Le HPA surveille le CPU en temps réel. Si la charge dépasse 70%, il ajoute des pods automatiquement jusqu'à 6 maximum."*

---

## 11. Démonstration du rollback

**Objectif** : Revenir à la version précédente en une commande.

```bash
# Voir l'historique
kubectl rollout history deployment/backend -n trombiflow

# Rollback
kubectl rollout undo deployment/backend -n trombiflow
kubectl rollout status deployment/backend -n trombiflow
```

**Résultat attendu** : `deployment "backend" successfully rolled out`

> *"Kubernetes conserve l'historique des déploiements. En cas de bug en production, je reviens à la version précédente en une commande, sans interruption de service."*

---

## 12. Conclusion

```bash
# Vue d'ensemble finale
kubectl get all -n trombiflow
```

> *"TrombiFlow est déployé avec 2 replicas backend et frontend, un autoscaling de 2 à 6 pods, des mises à jour sans interruption et un rollback en une commande. Toute l'infrastructure est décrite en code versionné dans le dossier k8s/."*

---

## Commandes de secours

*Si quelque chose ne fonctionne pas pendant la démo.*

```bash
# Vue d'ensemble rapide
kubectl get all -n trombiflow

# Détail d'un pod qui ne démarre pas
kubectl describe pod <nom-du-pod> -n trombiflow

# Logs d'un pod
kubectl logs <nom-du-pod> -n trombiflow
kubectl logs deployment/backend -n trombiflow --tail=20

# Historique des déploiements
kubectl rollout history deployment/backend -n trombiflow
kubectl rollout history deployment/frontend -n trombiflow

# Rollback d'urgence
kubectl rollout undo deployment/backend -n trombiflow
kubectl rollout undo deployment/frontend -n trombiflow

# Vérifier les conteneurs Docker
docker ps
docker compose ps
docker compose logs web --tail=20
docker compose logs db --tail=10

# Redémarrer la stack Compose si besoin
docker compose restart

# Relancer un pod spécifique K8s
kubectl delete pod -l app=backend -n trombiflow
```
