# Provenance QA Run

- Model: openai/gpt-5.5
- Conditions: full-transcript, keyword-snippets, memmould-map-zoom, subagent-map-zoom

## Results

| Condition | Pass | Answer | Provenance | Stats | Error |
|---|---:|---:|---:|---|---|
| full-transcript | true | true | true | [stats](conditions/full-transcript/stats.json) |  |
| keyword-snippets | true | true | true | [stats](conditions/keyword-snippets/stats.json) |  |
| memmould-map-zoom | true | true | true | [stats](conditions/memmould-map-zoom/stats.json) |  |
| subagent-map-zoom | false | false | true | [stats](conditions/subagent-map-zoom/stats.json) |  |

## Caveat

This benchmark tests provenance QA over synthetic prior sessions. It is not a coding-agent solve-rate benchmark.

