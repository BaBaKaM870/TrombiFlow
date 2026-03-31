FROM python:3.11-slim AS runtime

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
        tini \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r appgroup \
    && useradd -r -g appgroup appuser

ENV ENV=production
ENV PORT=8000
ENV STORAGE_TYPE=local
ENV UPLOAD_DIR=/data/uploads

# Runtime variables expected from environment/secrets manager:
# DATABASE_URL, JWT_SECRET

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY src ./src
COPY migrations ./migrations

RUN mkdir -p /data/uploads && chown -R appuser:appgroup /app /data/uploads

USER appuser
EXPOSE 8000

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
