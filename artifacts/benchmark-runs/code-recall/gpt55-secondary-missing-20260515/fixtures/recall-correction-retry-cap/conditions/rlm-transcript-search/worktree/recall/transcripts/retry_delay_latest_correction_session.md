# Retry delay latest correction
session_id: retry_delay_latest_correction_session
title: Retry delay latest correction

## message retry_correction_fact_1
Earlier retry-delay notes used a 5000ms cap, but that was superseded after mobile clients hit long backoff stalls.

## message retry_correction_fact_2
Latest accepted decision: cap retryDelayMs at 2000ms while keeping the 100ms exponential base.
