#!/bin/bash
set -e

# Create log directory
mkdir -p /var/log/supervisor

# Signal handler for graceful shutdown
cleanup() {
    echo "Received shutdown signal, stopping services..."
    # Only try supervisorctl if socket exists
    if [ -S /var/run/supervisor.sock ]; then
        supervisorctl stop all 2>/dev/null || true
    fi
    kill -TERM "$SUPERVISOR_PID" 2>/dev/null || true
    wait "$SUPERVISOR_PID" 2>/dev/null || true
    echo "Services stopped gracefully"
    exit 0
}

# Trap SIGTERM and SIGINT
trap cleanup SIGTERM SIGINT

echo "Starting P.A.T.H Agent Designer..."
echo "  Frontend: http://localhost:3009"
echo "  Backend:  http://localhost:8001 (internal)"

# Start supervisord in foreground mode but without exec so trap handlers fire
/usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf &
SUPERVISOR_PID=$!
wait "$SUPERVISOR_PID"
