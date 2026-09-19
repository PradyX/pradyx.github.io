#!/bin/bash
# Portfolio Website Server - Quick Start Script
# Usage: ./start.sh [port]
# Default port: 8000

PORT=${1:-8000}
cd "$(dirname "$0")"

echo "=========================================="
echo "  Portfolio Website Server"
echo "=========================================="
echo ""
echo "Starting HTTP server on port $PORT"
echo ""
echo "Access your portfolio at:"
echo "  http://localhost:$PORT"
echo ""
echo "Or from another machine:"
echo "  http://<your-ip>:$PORT"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=========================================="

exec python3 -m http.server "$PORT" --bind 127.0.0.1
