# Schema parser accepted quote handling decision
session_id: ses_1e0a1a542ffemUwL0UFdSuFkDX
title: Schema parser accepted quote handling decision
id_policy: cite the heading message id below, not fixture fact labels

## message msg_e1f5e5ad6001ROQYwAFmPVNvpX
- Accepted schema parser decision: split on pipe delimiters only when the pipe is outside double quotes, then trim each resulting field.
- Do not trim the whole header before tokenization because quoted delimiter boundaries must be preserved.
