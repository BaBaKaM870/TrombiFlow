# ============================================================
# Étape 1 : Builder - Installation des dépendances Python
# ============================================================
FROM python:3.11-slim AS builder

WORKDIR /build

# Copier le fichier de dépendances
COPY requirements.txt .

# Installer pip/setuptools/wheel de manière optimale et compiler les dépendances
# dans un répertoire dédié pour la copie ultérieure
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir \
        --target /build/install \
        --requirement requirements.txt

# ============================================================
# Étape 2 : Runtime - Image minimale optimisée
# ============================================================
FROM python:3.11-slim AS runtime

WORKDIR /app

# Installer uniquement les dépendances de runtime essentielles
# tini : responsable (init) et gestion des signaux
# tzdata : fuseaux horaires (optionnel, mais utile pour les logs)
RUN apt-get update && apt-get install -y --no-install-recommends \
        tini \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r appgroup \
    && useradd -r -g appgroup appuser

# Définir les variables d'environnement
ENV ENV=production
ENV PORT=8000
ENV STORAGE_TYPE=local
ENV UPLOAD_DIR=/data/uploads
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Copier les dépendances Python pré-compilées depuis le builder
COPY --from=builder --chown=appuser:appgroup /build/install \
    /usr/local/lib/python3.11/site-packages

# Copier uniquement les fichiers source nécessaires
# (pas d'outils de développement, pas de cache pip, etc.)
COPY --chown=appuser:appgroup src ./src
COPY --chown=appuser:appgroup migrations ./migrations
COPY --chown=appuser:appgroup migrate.py ./
COPY --chown=appuser:appgroup entrypoint.sh ./

# Nettoyer les retours à la ligne Windows et donner les droits d'exécution
RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

# Créer le répertoire des uploads avec les bons droits
RUN mkdir -p /data/uploads && chown -R appuser:appgroup /app /data/uploads

# Basculer vers l'utilisateur non-root (sécurité)
USER appuser

EXPOSE 8000

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["sh", "./entrypoint.sh"]
