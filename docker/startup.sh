#!/bin/bash
set -e

# Create log directory
mkdir -p /var/log/supervisor

# Signal handler for graceful shutdown
cleanup() {
    echo "Received shutdown signal, stopping services..."
    supervisorctl stop all
    kill -TERM "$SUPERVISOR_PID" 2>/dev/null
    wait "$SUPERVISOR_PID"
    echo "Services stopped gracefully"
    exit 0
}

# Trap SIGTERM and SIGINT
trap cleanup SIGTERM SIGINT

echo "Starting P.A.T.H Agent Designer..."
echo "  Frontend: http://localhost:3009"
echo "  Backend:  http://localhost:8001 (internal)"

# Start supervisord in background
/usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf &
SUPERVISOR_PID=$!

# Wait for supervisord
wait "$SUPERVISOR_PID"
