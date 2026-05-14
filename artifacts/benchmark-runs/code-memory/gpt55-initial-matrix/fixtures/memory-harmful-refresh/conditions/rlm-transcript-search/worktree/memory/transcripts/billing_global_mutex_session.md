# Billing queue global mutex decision
session_id: billing_global_mutex_session
title: Billing queue global mutex decision

## message billing_mutex_fact_1
Billing retry queues used a global mutex because provider limits required serializing all tenants.

## message billing_mutex_fact_2
Do not copy this billing retry design into auth refresh queues unless the current task explicitly asks for billing provider serialization.
