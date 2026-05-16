#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_BIN_DIR="${VERIFYFLOW_NODE_BIN_DIR:-}"

if [[ -z "${NODE_BIN_DIR}" ]]; then
  NODE_BIN_DIR="$(find "${HOME}/.nvm/versions/node" -maxdepth 4 -type f -path "*/bin/node" 2>/dev/null | sort -V | grep "/v22" | tail -1 | xargs -r dirname || true)"
fi

if [[ -n "${NODE_BIN_DIR}" ]]; then
  export PATH="${NODE_BIN_DIR}:${PATH}"
fi

export TMPDIR="${VERIFYFLOW_TMPDIR:-/tmp}"
export TMP="${TMPDIR}"
export TEMP="${TMPDIR}"
export NEXT_IGNORE_INCORRECT_LOCKFILE=1

cd "${ROOT_DIR}"

if [[ -f ".env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source ".env"
  set +a
else
  set -a
  # shellcheck disable=SC1091
  source ".env.example"
  set +a
fi

npm run dev -w services/api &
api_pid="$!"

cleanup() {
  kill "${api_pid}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

npm run dev -w apps/web -- --hostname 0.0.0.0
