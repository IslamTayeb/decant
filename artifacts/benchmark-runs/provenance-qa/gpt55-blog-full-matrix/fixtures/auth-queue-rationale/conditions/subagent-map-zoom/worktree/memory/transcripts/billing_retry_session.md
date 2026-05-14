# Billing retry queue rationale
session_id: billing_retry_session
title: Billing retry queue rationale

## message billing_fact_1
Billing retry queues used a global mutex because provider limits serialize all tenants.

## message billing_fact_2
This is not the auth refresh queue rationale.
