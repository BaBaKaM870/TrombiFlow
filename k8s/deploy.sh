#!/bin/bash

# ============================================================
# Script de déploiement TrombiFlow sur Kubernetes
# ============================================================
# Usage:
#   ./deploy.sh                    # Déploiement complet
#   ./deploy.sh --check-only       # Vérifier seulement
#   ./deploy.sh --cleanup          # Nettoyer le déploiement

set -e

# Couleurs pour l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="trombiflow"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$SCRIPT_DIR"
TIMEOUT=300

# Fonctions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Vérifier les prérequis
check_requirements() {
    print_header "Vérification des prérequis"

    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl n'est pas installé"
        exit 1
    fi
    print_success "kubectl détecté"

    if ! kubectl cluster-info &> /dev/null; then
        print_error "Impossible de se connecter au cluster Kubernetes"
        exit 1
    fi
    print_success "Connexion au cluster OK"

    # Vérifier si le namespace existe
    if kubectl get namespace $NAMESPACE &> /dev/null; then
        print_info "Namespace $NAMESPACE existe déjà"
    else
        print_info "Namespace $NAMESPACE sera créé"
    fi
}

# Vérifier les secrets
check_secrets() {
    print_header "Vérification des secrets"

    if kubectl get secret trombiflow-secrets -n $NAMESPACE &> /dev/null; then
        print_success "Secret trombiflow-secrets existe"
    else
        print_warning "Secret trombiflow-secrets n'existe pas!"
        print_info "Créer le secret avec l'une des méthodes :"
        print_info "  1. cp k8s/secret.example.yaml k8s/secret.yaml && kubectl apply -f k8s/secret.yaml"
        print_info "  2. Utiliser des variables d'env (voir README.md)"
        return 1
    fi

    return 0
}

# Déployer les manifests
deploy() {
    print_header "Déploiement des ressources Kubernetes"

    # 1. Namespace et ServiceAccount
    print_info "Création du namespace et ServiceAccount..."
    kubectl apply -f "$K8S_DIR/namespace.yaml"
    kubectl apply -f "$K8S_DIR/serviceaccount.yaml"
    print_success "Namespace et ServiceAccount créés"

    # 2. ConfigMap
    print_info "Création de la ConfigMap..."
    kubectl apply -f "$K8S_DIR/configmap.yaml"
    print_success "ConfigMap créée"

    # 3. Secret (vérifier qu'il existe)
    if ! kubectl get secret trombiflow-secrets -n $NAMESPACE &> /dev/null; then
        print_error "Secret trombiflow-secrets n'existe pas! Créer d'abord avec la documentation"
        exit 1
    fi
    print_success "Secret trouvé"

    # 4. Infrastructure (DB, MinIO)
    print_info "Déploiement de PostgreSQL..."
    kubectl apply -f "$K8S_DIR/postgres.yaml"
    print_success "PostgreSQL déployé"

    print_info "Déploiement de MinIO..."
    kubectl apply -f "$K8S_DIR/minio.yaml"
    print_success "MinIO déployé"

    # 5. Backend et Frontend
    print_info "Déploiement du Backend..."
    kubectl apply -f "$K8S_DIR/backend.yaml"
    print_success "Backend déployé"

    print_info "Déploiement du Frontend..."
    kubectl apply -f "$K8S_DIR/frontend.yaml"
    print_success "Frontend déployé"

    # 6. Network Policies et Ingress
    print_info "Configuration des Network Policies..."
    kubectl apply -f "$K8S_DIR/networkpolicy.yaml"
    print_success "Network Policies configurées"

    print_info "Configuration de l'Ingress..."
    kubectl apply -f "$K8S_DIR/ingress.yaml"
    print_success "Ingress configuré"

    # 7. Autoscaling
    print_info "Configuration de l'autoscaling..."
    kubectl apply -f "$K8S_DIR/hpa.yaml"
    print_success "Autoscaling configuré"
}

# Attendre que les pods soient prêts
wait_for_pods() {
    print_header "Attente des pods"

    local apps=("postgres" "minio" "backend" "frontend")

    for app in "${apps[@]}"; do
        print_info "Attente de $app..."
        if timeout $TIMEOUT kubectl wait --for=condition=ready pod \
            -l app=$app \
            -n $NAMESPACE \
            --timeout=${TIMEOUT}s 2>/dev/null; then
            print_success "$app est prêt"
        else
            print_warning "$app n'est pas prêt après $TIMEOUT secondes (normal au premier déploiement)"
        fi
    done
}

# Vérifier le status
check_status() {
    print_header "Status des déploiements"

    echo ""
    echo "Pods:"
    kubectl get pods -n $NAMESPACE
    echo ""
    echo "Services:"
    kubectl get svc -n $NAMESPACE
    echo ""
    echo "PersistentVolumeClaims:"
    kubectl get pvc -n $NAMESPACE
    echo ""
}

# Nettoyer le déploiement
cleanup() {
    print_header "Nettoyage"

    read -p "Êtes-vous sûr de vouloir supprimer le namespace $NAMESPACE? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Suppression du namespace $NAMESPACE..."
        kubectl delete namespace $NAMESPACE --ignore-not-found=true
        print_success "Namespace supprimé"
    else
        print_info "Nettoyage annulé"
    fi
}

# Main
main() {
    case "${1:-}" in
        --check-only)
            check_requirements
            check_secrets || exit 1
            check_status
            ;;
        --cleanup)
            cleanup
            ;;
        --help)
            echo "Usage: $0 [OPTION]"
            echo ""
            echo "Options:"
            echo "  (default)      Déploiement complet"
            echo "  --check-only   Vérifier l'état sans déployer"
            echo "  --cleanup      Supprimer le déploiement"
            echo "  --help         Afficher cette aide"
            ;;
        *)
            check_requirements
            if check_secrets; then
                deploy
                wait_for_pods
                check_status
                echo ""
                print_success "Déploiement terminé!"
                print_info "Pour accéder à l'application:"
                print_info "  - Port-forward: kubectl port-forward svc/frontend 5173:80 -n $NAMESPACE"
                print_info "  - Ou configurer l'Ingress (voir README.md)"
            else
                print_error "Impossible de continuer sans les secrets"
                exit 1
            fi
            ;;
    esac
}

# Lancer
main "$@"
