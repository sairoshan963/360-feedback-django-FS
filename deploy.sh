#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# 360 Feedback Django — One-command deploy
# Run from project root: ./deploy.sh
#
# What it does:
#   1. Checks ansible is installed
#   2. Runs the Ansible playbook against the server
# ─────────────────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Deploying 360 Feedback Django to server..."
echo ""

# Check ansible is installed
if ! command -v ansible-playbook &>/dev/null; then
  echo "❌ ansible-playbook not found. Install with:"
  echo "   pip install ansible   OR   sudo apt install ansible"
  exit 1
fi

# Run playbook
ansible-playbook \
  -i "$SCRIPT_DIR/ansible/inventory.ini" \
  "$SCRIPT_DIR/ansible/playbook.yml" \
  "$@"

echo ""
echo "✅ Deploy complete!"
echo "   App: http://164.52.215.113:5173/"
