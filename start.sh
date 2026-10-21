#!/usr/bin/env bash
# Start StudyBuddy RAG: FastAPI backend (port 8000) + Vite frontend (port 5173).
# Usage: ./start.sh [--install]   (--install forces dependency install)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/nerd-RAG-backend"
VENV_DIR="$BACKEND_DIR/venv"
FORCE_INSTALL=false
[[ "${1:-}" == "--install" ]] && FORCE_INSTALL=true

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    trap - EXIT INT TERM
    echo
    echo "Shutting down..."
    for pid in "$FRONTEND_PID" "$BACKEND_PID"; do
        if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
            kill -- -"$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
        fi
    done
    wait 2>/dev/null || true
    echo "Stopped."
}
trap cleanup EXIT INT TERM

# ---------- Backend ----------
if [[ ! -f "$BACKEND_DIR/.env" ]]; then
    echo "Error: $BACKEND_DIR/.env not found."
    echo "Copy nerd-RAG-backend/.env.example to nerd-RAG-backend/.env and fill in the values."
    exit 1
fi

# Local MongoDB (Atlas Local image) must be up before the backend connects
MONGO_CONTAINER="${MONGO_CONTAINER:-studybuddy-mongo}"
if command -v docker >/dev/null && docker inspect "$MONGO_CONTAINER" >/dev/null 2>&1; then
    if [[ "$(docker inspect -f '{{.State.Running}}' "$MONGO_CONTAINER")" != true ]]; then
        echo "Starting MongoDB container ($MONGO_CONTAINER)..."
        docker start "$MONGO_CONTAINER" >/dev/null
    fi
    for _ in $(seq 1 30); do
        health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}healthy{{end}}' "$MONGO_CONTAINER")"
        [[ "$health" == healthy ]] && break
        sleep 2
    done
    echo "MongoDB: $health"
else
    echo "Warning: MongoDB container '$MONGO_CONTAINER' not found; make sure MONGODB_URI is reachable."
fi

if [[ ! -d "$VENV_DIR" ]]; then
    echo "Creating Python virtual environment..."
    python3 -m venv "$VENV_DIR"
    FORCE_INSTALL_BACKEND=true
else
    FORCE_INSTALL_BACKEND=$FORCE_INSTALL
fi

if [[ "$FORCE_INSTALL_BACKEND" == true ]]; then
    echo "Installing backend dependencies..."
    "$VENV_DIR/bin/pip" install -r "$BACKEND_DIR/requirements.txt"
fi

# ---------- Frontend ----------
if [[ ! -d "$ROOT_DIR/node_modules" || "$FORCE_INSTALL" == true ]]; then
    echo "Installing frontend dependencies..."
    (cd "$ROOT_DIR" && npm install)
fi

# ---------- Run ----------
# setsid gives each process its own group so cleanup kills reloader children too.
echo "Starting backend on http://localhost:8000 ..."
(cd "$BACKEND_DIR" && exec setsid "$VENV_DIR/bin/python" manage.py) \
    > >(sed -u 's/^/[backend]  /') 2>&1 &
BACKEND_PID=$!

echo "Starting frontend on http://localhost:5173 ..."
(cd "$ROOT_DIR" && exec setsid npm run dev) \
    > >(sed -u 's/^/[frontend] /') 2>&1 &
FRONTEND_PID=$!

echo "Press Ctrl+C to stop both."

# Exit when either process dies (cleanup trap stops the other).
wait -n "$BACKEND_PID" "$FRONTEND_PID"
