# Memory Infra Frontier

- Generated: 2026-06-01T21:58:36.798Z
- Costs are diagnostic estimates from token accounting, not billing truth.
- Carried chars are the maintained/default memory artifact size multiplied across future query turns.

## High Fanout Mixed Workload

96 old topics, 4 exact recall queries, then 96 unrelated current-work queries.

| Run | Row | Condition | Pass | Recall | Current | Artifact Chars | Total Carried Chars | Current Carried Chars | Query Input | Query Tokens | Query Cost | Total Cost |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| gpt55fast-mixed-t96-r4-c96-default | gpt55fast-mixed-t96-r4-c96-default | default-compaction | false | 0/4 | 96/96 | 11,826 | 1,182,600 | 1,135,296 | 185,093 | 799,070 | $1.46 | $3.17 |
| gpt55fast-mixed-t96-r4-c96-rgb | gpt55fast-mixed-t96-r4-c96-rgb | rgb-context | true | 4/4 | 96/96 | 36,854 | 3,685,400 | 3,537,984 | 225,869 | 1,416,720 | $1.95 | $3.39 |
| gpt55fast-mixed-t96-r4-c96-decant | gpt55fast-mixed-t96-r4-c96-decant | decant-direct | true | 4/4 | 96/96 | 0 | 0 | 0 | 85,264 | 513,625 | $0.83 | $2.36 |

Decant vs passing RGB: 63.7% lower query tokens, 57.4% lower query cost, 30.3% lower total cost.

## Recall Frontier

96 old topics, 16 exact recall queries, no current-work fanout. RGB rows show the quality/carry tradeoff as the maintained artifact shrinks.

| Run | Row | Condition | Pass | Recall | Current | Artifact Chars | Total Carried Chars | Current Carried Chars | Query Input | Query Tokens | Query Cost | Total Cost |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| gpt55fast-frontier-t96-r16-rgb-budget2000 | gpt55fast-frontier-t96-r16-rgb-budget2000 | rgb-context | false | 15/16 | 0/0 | 3,585 | 57,360 | 0 | 16,154 | 88,530 | $0.24 | $1.40 |
| gpt55fast-frontier-t96-r16-rgb-unbounded | gpt55fast-frontier-t96-r16-rgb-unbounded | rgb-context | true | 16/16 | 0/0 | 29,261 | 468,176 | 0 | 75,338 | 189,154 | $0.51 | $2.19 |
| gpt55fast-frontier-t96-r16-decant | gpt55fast-frontier-t96-r16-decant | decant-direct | true | 16/16 | 0/0 | 0 | 0 | 0 | 28,925 | 158,033 | $0.27 | $1.44 |

Decant vs passing RGB: 16.5% lower query tokens, 47.0% lower query cost, 34.2% lower total cost.

## Irregular Fact Continuation Control

24 irregular old topics, 4 exact recall queries, then 12 unrelated current-work queries. The default row continues in the same compacted OpenCode session instead of receiving a pasted summary artifact.

| Run | Row | Condition | Pass | Recall | Current | Artifact Chars | Total Carried Chars | Current Carried Chars | Query Input | Query Tokens | Query Cost | Total Cost |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| gpt55fast-irregular-t24-r4-c12-default-opencode-continuation | gpt55fast-irregular-t24-r4-c12-default-opencode-continuation | default-opencode-continuation | false | 0/4 | 12/12 | 14,385 | 230,160 | 172,620 | 26,594 | 182,003 | $0.25 | $0.67 |
| gpt55fast-irregular-t24-r4-c12-rgb-longtimeout | gpt55fast-irregular-t24-r4-c12-rgb-longtimeout | rgb-context | true | 4/4 | 12/12 | 12,608 | 201,728 | 151,296 | 53,331 | 130,670 | $0.35 | $0.77 |
| gpt55fast-irregular-t24-r4-c12-decant | gpt55fast-irregular-t24-r4-c12-decant | decant-direct | true | 4/4 | 12/12 | 0 | 0 | 0 | 48,755 | 99,421 | $0.31 | $0.60 |

Decant vs passing RGB: 23.9% lower query tokens, 10.7% lower query cost, 22.5% lower total cost.

Default OpenCode continuation: 0/4 recall, 12/12 current. This separates current-task hygiene from exact historical recovery.

## Threshold Fanout Control

8 irregular old topics and 4 exact recall queries, with unrelated current-work fanout. At 48 future turns, real OpenCode continuation, RGB, and Decant all pass; at 96 turns, RGB and Decant still pass while default continuation loses exact recall.

| Run | Row | Condition | Pass | Recall | Current | Artifact Chars | Total Carried Chars | Current Carried Chars | Query Input | Query Tokens | Query Cost | Total Cost |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| gpt55fast-threshold-irregular-t8-r4-c48-all | t8/r4/c48 default continuation | default-opencode-continuation | true | 4/4 | 48/48 | 5,732 | 298,064 | 275,136 | 46,380 | 855,203 | $0.74 | $0.88 |
| gpt55fast-threshold-irregular-t8-r4-c48-all | t8/r4/c48 RGB | rgb-context | true | 4/4 | 48/48 | 4,202 | 218,504 | 201,696 | 88,221 | 305,439 | $0.67 | $0.85 |
| gpt55fast-threshold-irregular-t8-r4-c48-all | t8/r4/c48 Decant | decant-direct | true | 4/4 | 48/48 | 0 | 0 | 0 | 68,639 | 277,404 | $0.56 | $0.66 |
| gpt55fast-threshold-irregular-t8-r4-c96-main | t8/r4/c96 default continuation | default-opencode-continuation | false | 1/4 | 96/96 | 5,352 | 535,200 | 513,792 | 99,941 | 2,622,708 | $1.95 | $2.12 |
| gpt55fast-threshold-irregular-t8-r4-c96-main | t8/r4/c96 RGB | rgb-context | true | 4/4 | 96/96 | 4,123 | 412,300 | 395,808 | 133,681 | 586,861 | $1.12 | $1.31 |
| gpt55fast-threshold-irregular-t8-r4-c96-main | t8/r4/c96 Decant | decant-direct | true | 4/4 | 96/96 | 0 | 0 | 0 | 89,768 | 514,767 | $0.87 | $0.98 |

Decant vs passing RGB: 9.2% lower query tokens, 16.3% lower query cost, 22.3% lower total cost.

At c48, all three main contenders pass. Decant total cost is 25.2% lower than real default continuation and 22.3% lower than RGB, with zero current-work carried memory.

At c96, RGB and Decant both pass while default continuation drops to 1/4 recall. Decant total cost is 25.1% lower than RGB, with zero current-work carried memory.

## Irregular Exact-Fidelity Frontier

24 irregular old topics, 8 exact recall queries, and 24 unrelated current-work queries. The default row continues in the same compacted OpenCode session. RGB rows show compressed-artifact failure versus larger-artifact success; Decant recovers exact old facts with no carried memory artifact.

| Run | Row | Condition | Pass | Recall | Current | Artifact Chars | Total Carried Chars | Current Carried Chars | Query Input | Query Tokens | Query Cost | Total Cost |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| gpt55fast-irregular-frontier-t24-r8-c24-defaults | default continuation | default-opencode-continuation | false | 1/8 | 24/24 | 13,844 | 443,008 | 332,256 | 27,160 | 451,621 | $0.42 | $0.85 |
| gpt55fast-irregular-frontier-t24-r8-c24-defaults | pasted default summary | default-compaction | false | 1/8 | 24/24 | 11,488 | 367,616 | 275,712 | 83,161 | 263,494 | $0.61 | $0.91 |
| gpt55fast-irregular-frontier-t24-r8-c24-rgb2500-decant | RGB budget-constrained | rgb-context | false | 0/8 | 24/24 | 7,998 | 255,936 | 191,952 | 63,748 | 227,517 | $0.52 | $0.86 |
| gpt55fast-irregular-frontier-t24-r8-c24-rgb-unbounded | RGB unbounded | rgb-context | true | 8/8 | 24/24 | 12,248 | 391,936 | 293,952 | 67,364 | 259,947 | $0.53 | $0.92 |
| gpt55fast-irregular-frontier-t24-r8-c24-rgb2500-decant | Decant direct lookup | decant-direct | true | 8/8 | 24/24 | 0 | 0 | 0 | 40,305 | 198,987 | $0.37 | $0.63 |

Decant vs passing RGB: 23.5% lower query tokens, 29.6% lower query cost, 31.5% lower total cost.

Default OpenCode continuation: 1/8 recall, 24/24 current. This separates current-task hygiene from exact historical recovery.

## Fanout Scaling

All rows use 96 old topics and 4 exact recall queries. RGB and Decant both pass every listed run; the table shows the query-side delta as unrelated future work increases.

| Future Current Turns | RGB Query Tokens | Decant Query Tokens | Query Token Delta | RGB Current Carried Chars | Decant Current Carried Chars | Query Cost Delta | Total Cost Delta |
|---|---:|---:|---:|---:|---:|---:|---:|
| 24 current turns | 379,996 | 158,176 | 58.4% lower | 870,504 | 0 | 60.1% lower | 46.2% lower |
| 48 current turns | 623,109 | 276,620 | 55.6% lower | 1,404,528 | 0 | 58.5% lower | 18.2% lower |
| 96 current turns | 1,416,720 | 513,625 | 63.7% lower | 3,537,984 | 0 | 57.4% lower | 30.3% lower |
| 96 current turns (rep2) | 1,359,724 | 514,375 | 62.2% lower | 3,483,552 | 0 | 55.8% lower | 30.9% lower |

Across 4 same-quality fanout points: yes. Decant query-token reduction range: 55.6%-63.7%. Decant query-cost reduction range: 55.8%-60.1%. RGB current-work old-memory exposure range: 870,504-3,537,984 chars; Decant exposure is 0 in every row.

Interpretation: the repeatable signal here is the query-side routing/exposure win. Total cost is listed but should remain secondary because prep cost varies across live model runs.
