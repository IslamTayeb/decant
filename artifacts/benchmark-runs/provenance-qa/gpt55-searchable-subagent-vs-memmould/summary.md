# Provenance QA Run

- Model: openai/gpt-5.5
- Conditions: rlm-transcript-search, subagent-rlm-transcript-search, memmould-map-zoom, subagent-map-zoom

## Results

| Condition | Pass | Answer | Provenance | Stats | Error |
|---|---:|---:|---:|---|---|
| rlm-transcript-search | true | true | true | [stats](conditions/rlm-transcript-search/stats.json) |  |
| subagent-rlm-transcript-search | true | true | true | [stats](conditions/subagent-rlm-transcript-search/stats.json) |  |
| memmould-map-zoom | true | true | true | [stats](conditions/memmould-map-zoom/stats.json) |  |
| subagent-map-zoom | true | true | true | [stats](conditions/subagent-map-zoom/stats.json) |  |

## Caveat

This benchmark tests provenance QA over synthetic prior sessions. It is not a coding-agent solve-rate benchmark.

