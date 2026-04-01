FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .
RUN npm run build

# Support both Vite (dist) and CRA (build) outputs.
RUN if [ -d dist ]; then cp -r dist /tmp/webroot; \
	elif [ -d build ]; then cp -r build /tmp/webroot; \
	else echo "No frontend build output folder found (dist/build)" && exit 1; fi

FROM nginx:1.27-alpine AS runtime

# Replace default site config with SPA + API proxy config.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /tmp/webroot /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
	CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
