#!/bin/bash
# AI Opportunity Machine — Daily Runner
# Usage:
#   ./run.sh              Run pipeline + open dashboard
#   ./run.sh --autopilot  Run in autopilot mode (cron + dashboard)
#   ./run.sh --dashboard  Dashboard only (view existing reports)

cd "$(dirname "$0")"

MODE="${1:---full-run}"

echo "⚡ AI Opportunity Machine"
echo "Mode: $MODE"
echo ""

node execution/index.js "$MODE"
