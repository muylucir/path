# =============================================================================
# Multi-stage Dockerfile for P.A.T.H Agent Designer
# Runs Next.js frontend (3009) + FastAPI backend (8001) in single container
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Node.js dependencies
# -----------------------------------------------------------------------------
FROM node:22-slim AS node-deps

WORKDIR /app/frontend

# Copy package files
COPY path-web/package.json path-web/package-lock.json* ./

# Install dependencies
RUN npm ci

# -----------------------------------------------------------------------------
# Stage 2: Next.js build (standalone output)
# -----------------------------------------------------------------------------
FROM node:22-slim AS node-builder

WORKDIR /app/frontend

# Copy dependencies from previous stage
COPY --from=node-deps /app/frontend/node_modules ./node_modules

# Copy source code
COPY path-web/ ./

# Build Next.js application (standalone mode)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Runtime image (Python base with Node.js installed)
# -----------------------------------------------------------------------------
FROM python:3.11-slim AS runtime

# Install Node.js 22 and supervisord
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    supervisor \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get remove -y gnupg \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

# Create app directories
WORKDIR /app

# Install Python dependencies directly (no venv needed in container)
COPY path-strands-agent/requirements.txt ./backend/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r backend/requirements.txt

# Copy Next.js standalone build (much smaller than full node_modules)
COPY --from=node-builder /app/frontend/.next/standalone ./frontend/
COPY --from=node-builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=node-builder /app/frontend/public ./frontend/public

# Copy backend source code
COPY path-strands-agent/ ./backend/

# Copy supervisor and startup configurations
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/startup.sh /app/startup.sh
RUN chmod +x /app/startup.sh

# Environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PYTHONUNBUFFERED=1
ENV AWS_DEFAULT_REGION=ap-northeast-2

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser \
    && mkdir -p /var/log/supervisor /var/run \
    && chown -R appuser:appuser /app /var/log/supervisor /var/run

USER appuser

# Expose frontend port (backend is internal)
EXPOSE 3009

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3009/api/health || exit 1

# Start supervisord
CMD ["/app/startup.sh"]
