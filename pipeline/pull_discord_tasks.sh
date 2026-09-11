#!/usr/bin/env bash
# Stationhouse Discord task-intake pipeline, step 1: mechanical retrieval.
#
# 1. Refreshes the mumwelt (`mum`) corpus — the local mirror of Marin's Discord/GitHub.
# 2. Runs a set of category-scoped searches over the last 7 days of Discord messages
#    for each pipeline column (infrastructure / data / evals), merging and deduping
#    hits by URL.
#
# NOTE: `mum search-multi --since` does not apply the date filter (checked against
# the mum CLI shipped with mumwelt v0.1.0) — use individual `mum search` calls instead.
#
# This script only retrieves candidate messages into pipeline/raw/*.json. Turning
# those candidates into vetted task cards (dropping resolved threads, casual chatter,
# and duplicates; writing discord-data.js) is a judgment call that needs a read of
# each thread — run that pass with Claude Code / mumwelt afterward, or by hand.
#
# Usage: ./pull_discord_tasks.sh [since_date]   (default: 7 days ago)

set -euo pipefail
cd "$(dirname "$0")"

SINCE="${1:-$(date -v-7d +%Y-%m-%d 2>/dev/null || date -d '7 days ago' +%Y-%m-%d)}"
echo "Pulling Discord candidates since $SINCE"

echo "== mum refresh =="
mum refresh

mkdir -p raw
run_query() {
  local outfile="$1"; shift
  local q="$1"
  mum search "$q" --source discord --since "$SINCE" -k 20 --json > "raw/$outfile"
}

# Infrastructure: cluster/training/serving/scheduling/observability
run_query infra1.json "NVLink hang investigation GB200"
run_query infra2.json "ragged all-to-all EP rollback throughput"
run_query infra3.json "cluster infra reliability roadmap"
run_query infra4.json "canary failures training run"
run_query infra5.json "checkpoint provenance launch tracking"
run_query infra6.json "training infra automation needed"
run_query infra7.json "per-task qc automation infra roadmap"

# Data: curation / datakit / datasets / task generation
run_query data1.json "TaskTrove quality audit invalid broken tasks"
run_query data2.json "synthetic task generation pipeline agents"
run_query data3.json "data curation dedupe quality filter"
run_query data4.json "Common Crawl curation focus crawl"
run_query data5.json "dataset registration new data"
run_query data6.json "reproducible task template python script"

# Evals: benchmarks / eval harness / leaderboard
run_query evals1.json "MRCR long context eval results"
run_query evals2.json "Paloma benchmark scaling forecast"
run_query evals3.json "SWE-bench eval pass rate"
run_query evals4.json "eval leaderboard results"
run_query evals5.json "benchmark request need eval"
run_query evals6.json "eval harness gap coverage"

python3 - <<'PY'
import json, glob

for cat in ["infra", "data", "evals"]:
    seen = {}
    for f in sorted(glob.glob(f"raw/{cat}*.json")):
        for h in json.load(open(f)):
            seen[h["url"]] = h
    merged = sorted(seen.values(), key=lambda h: h["date"], reverse=True)
    json.dump(merged, open(f"raw/{cat}_merged.json", "w"), indent=1)
    print(f"{cat}: {len(merged)} unique candidate messages -> raw/{cat}_merged.json")
PY

echo
echo "Next: review raw/{infra,data,evals}_merged.json (mum show any ambiguous hit to"
echo "check for a later resolution/pivot), keep only genuine open asks, and write the"
echo "result into discord-data.js as window.__DISCORD_INFRA__ / __DATA__ / __EVALS__."
