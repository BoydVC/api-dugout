#!/usr/bin/env bash
# API Solomon Dugout: build the offline snapshot, then serve on 127.0.0.1:4283.
#   ./run.sh           build + serve
#   ./run.sh --shots   build + re-shoot screenshots + serve
set -euo pipefail
cd "$(dirname "$0")"
PORT=4283
python3 build.py
if [[ "${1:-}" == "--shots" ]]; then node --experimental-websocket tests/screens.mjs; fi
if ss -ltn | grep -q "127.0.0.1:$PORT "; then echo "already serving on http://127.0.0.1:$PORT/"; else
  nohup python3 server.py > /tmp/api-dugout-$PORT.log 2>&1 &
  sleep 1; echo "serving http://127.0.0.1:$PORT/ (pid $!)  ·  offline file: dist/api-dugout.html"; fi
