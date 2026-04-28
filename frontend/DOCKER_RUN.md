Frontend - exécution via Docker

But: permettre aux contributeurs de lancer le frontend sans installer Node localement.

Dev rapide (montre le projet et exécute Vite en dev):

```bash
# depuis la racine du repo
docker run --rm -it -p 5173:5173 -v "$PWD/frontend":/app -w /app node:20-bullseye-slim bash -lc "npm ci && npm run dev"
```

Build production (construire l'image Docker du frontend):

```bash
docker build -t trombiflow-frontend ./frontend
docker run --rm -p 8080:80 trombiflow-frontend
```

Notes:
- Sur Windows PowerShell, remplacez `"$PWD/frontend"` par `${PWD}/frontend` ou utilisez des chemins absolus.
- Le `Dockerfile` existant dans `frontend/` construit et sert le site via `nginx`.
