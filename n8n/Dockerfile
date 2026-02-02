FROM n8nio/n8n:latest

# Environment Configuration
ENV N8N_HOST=0.0.0.0
ENV N8N_PORT=5678
ENV N8N_PROTOCOL=https
ENV GENERIC_TIMEZONE=Asia/Kolkata
ENV TZ=Asia/Kolkata

# Data persistence
ENV N8N_USER_FOLDER=/home/node/.n8n

# Disable diagnostics
ENV N8N_DIAGNOSTICS_ENABLED=false
ENV N8N_PERSONALIZATION_ENABLED=false

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5678/healthz || exit 1

# Expose port
EXPOSE 5678

# Start command
CMD ["n8n", "start"]
