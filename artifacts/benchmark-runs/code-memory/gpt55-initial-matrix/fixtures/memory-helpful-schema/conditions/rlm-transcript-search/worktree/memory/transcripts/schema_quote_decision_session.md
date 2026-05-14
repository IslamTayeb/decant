# Schema parser accepted quote handling decision
session_id: schema_quote_decision_session
title: Schema parser accepted quote handling decision

## message schema_quote_fact_1
Accepted schema parser decision: split on pipe delimiters only when the pipe is outside double quotes, then trim each resulting field.

## message schema_quote_fact_2
Do not trim the whole header before tokenization because quoted delimiter boundaries must be preserved.
