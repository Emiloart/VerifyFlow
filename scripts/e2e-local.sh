#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

export VERIFYFLOW_TEST_AUTH_ENABLED=true
export VERIFYFLOW_TEST_AUTH_EMAIL="${VERIFYFLOW_TEST_AUTH_EMAIL:-friend@example.com}"
export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:3000}"

if [[ -z "${PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH:-}" ]]; then
  for candidate in \
    "/usr/bin/google-chrome" \
    "/usr/bin/google-chrome-stable" \
    "/usr/bin/chromium" \
    "/usr/bin/chromium-browser"; do
    if [[ -x "${candidate}" ]]; then
      export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="${candidate}"
      break
    fi
  done
fi

docker compose -f infra/local/docker-compose.yml up -d

set -a
if [[ -f ".env" ]]; then
  # shellcheck disable=SC1091
  source ".env"
else
  # shellcheck disable=SC1091
  source ".env.example"
fi
set +a

export VERIFYFLOW_TEST_AUTH_ENABLED=true
export VERIFYFLOW_TEST_AUTH_EMAIL="${VERIFYFLOW_TEST_AUTH_EMAIL:-friend@example.com}"

npm run db:push -w services/api

setsid npm run dev &
dev_pid="$!"

cleanup() {
  kill -- "-${dev_pid}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

for _ in {1..90}; do
  if curl -fsS http://127.0.0.1:4100/healthz >/dev/null 2>&1 && curl -fsS "${PLAYWRIGHT_BASE_URL}" >/dev/null 2>&1; then
    npm run test:e2e -- --project=chromium
    exit 0
  fi
  sleep 1
done

echo "Timed out waiting for local VerifyFlow stack." >&2
exit 1
