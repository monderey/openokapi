#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
}

OS_NAME="$(uname -s)"
ARCH_NAME="$(uname -m)"

if [[ "$OS_NAME" == "Darwin" ]]; then
  PLATFORM="macos"
elif [[ "$OS_NAME" == "Linux" ]]; then
  PLATFORM="linux"
else
  log_error "Unsupported OS: $OS_NAME"
  exit 1
fi

if [[ "$ARCH_NAME" == "x86_64" ]]; then
  ARCH="x64"
elif [[ "$ARCH_NAME" == "arm64" || "$ARCH_NAME" == "aarch64" ]]; then
  ARCH="arm64"
else
  log_error "Unsupported CPU arch: $ARCH_NAME"
  exit 1
fi

BIN_NAME="openokapi-${PLATFORM}-${ARCH}"
SRC_PATH="$(cd "$(dirname "$0")/.." && pwd)/dist/bin/${BIN_NAME}"
DIST_PATH="$(cd "$(dirname "$0")/.." && pwd)/dist"

WRAPPER=$(cat <<'WRAPPER_EOF'
#!/bin/bash
exec node "DIST_PATH_PLACEHOLDER/cli/index.cjs" "$@"
WRAPPER_EOF
)
WRAPPER="${WRAPPER//DIST_PATH_PLACEHOLDER/$DIST_PATH}"

if [[ -d "/opt/homebrew/bin" && -w "/opt/homebrew/bin" ]]; then
  INSTALL_DIR="/opt/homebrew/bin"
elif [[ -w "/usr/local/bin" ]]; then
  INSTALL_DIR="/usr/local/bin"
else
  INSTALL_DIR="$HOME/.local/bin"
  mkdir -p "$INSTALL_DIR"
  if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    export PATH="$INSTALL_DIR:$PATH"
    for rc in "$HOME/.zshrc" "$HOME/.zprofile" "$HOME/.bashrc"; do
      if [[ -f "$rc" ]] && ! grep -q "\.local/bin" "$rc"; then
        printf '\nexport PATH="$HOME/.local/bin:$PATH"\n' >> "$rc"
      fi
    done
  fi
fi

echo "$WRAPPER" > "$INSTALL_DIR/openokapi"
chmod +x "$INSTALL_DIR/openokapi"

echo
log_info "OpenOKAPI installation complete"
echo

log_success "Installed: $INSTALL_DIR/openokapi"
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
  log_warning "Restart terminal to apply PATH changes"
fi
echo
