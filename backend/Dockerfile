FROM node:20-alpine AS deps-prod

WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

FROM node:20-alpine AS deps-build

WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM node:20-alpine AS build

WORKDIR /app
COPY --from=deps-build /app/node_modules ./node_modules
COPY . .
# Keep this step optional to support JS and TS repositories.
RUN npm run build --if-present

FROM node:20-alpine AS runtime

WORKDIR /app

RUN apk add --no-cache tini \
	&& addgroup -S appgroup \
	&& adduser -S appuser -G appgroup

ENV NODE_ENV=production
ENV PORT=3000
ENV STORAGE=local
ENV PDF_ENGINE=wkhtmltopdf

# Runtime variables expected from environment/secrets manager:
# DATABASE_URL, JWT_SECRET, and optional S3 settings.

COPY package*.json ./
COPY --from=deps-prod /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/migrations ./migrations

RUN mkdir -p /data/uploads && chown -R appuser:appgroup /app /data/uploads

USER appuser
EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/app.js"]
