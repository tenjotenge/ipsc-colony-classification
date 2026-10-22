#!/usr/bin/env bash
set -euo pipefail

root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
python="$root/.venv/bin/python"

usage() {
  cat <<'EOF'
Usage: linux-v1/run.sh check
       linux-v1/run.sh pipeline
       linux-v1/run.sh analysis INPUT_DIR OUTPUT_DIR
       linux-v1/run.sh service [--data-dir DIR] [--workers 1-4]
       linux-v1/run.sh backup create|scheduled|verify|restore ...
       linux-v1/run.sh frontend
       linux-v1/run.sh frontend-start
EOF
}

case "${1:-}" in
  check|pipeline|analysis|service|backup)
    if [[ ! -x "$python" ]]; then
      echo "Missing .venv/bin/python. Create the Python environment first; see README.md." >&2
      exit 1
    fi
    cd "$root"
    case "$1" in
      check) exec "$python" run_pipeline.py --check ;;
      pipeline) exec "$python" run_pipeline.py ;;
      service) exec "$python" -m platform_service.server "${@:2}" ;;
      backup) exec "$python" -m platform_service.backup "${@:2}" ;;
      analysis)
        if [[ $# -ne 3 ]]; then usage >&2; exit 2; fi
        exec "$python" run_analysis.py --input "$2" --output "$3"
        ;;
    esac
    ;;
  frontend|frontend-start)
    if [[ ! -d "$root/frontend/node_modules" ]]; then
      echo "Missing frontend/node_modules. Run 'npm ci' in frontend/ first." >&2
      exit 1
    fi
    cd "$root/frontend"
    if [[ "$1" == "frontend-start" ]]; then
      if [[ ! -d "$root/frontend/.next" ]]; then
        echo "Missing frontend/.next. Run 'npm run build' in frontend/ first." >&2
        exit 1
      fi
      exec npm run start -- --hostname 127.0.0.1
    fi
    exec npm run dev -- --hostname 127.0.0.1
    ;;
  -h|--help|help) usage ;;
  *) usage >&2; exit 2 ;;
esac
