# Retry delay latest correction
session_id: ses_1d6a22e8effeAqAcu2LhI7XK2f
title: Retry delay latest correction
id_policy: cite the heading message id below, not fixture fact labels

## message msg_e295dd18a001zZsR04iUAlpxTr
- Earlier retry-delay notes used a 5000ms cap, but that was superseded after mobile clients hit long backoff stalls.
- Latest accepted decision: cap retryDelayMs at 2000ms while keeping the 100ms exponential base.
