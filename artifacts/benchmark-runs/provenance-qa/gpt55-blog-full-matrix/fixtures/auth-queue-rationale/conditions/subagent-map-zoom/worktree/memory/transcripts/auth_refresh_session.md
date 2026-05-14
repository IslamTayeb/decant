# Auth refresh queue rationale
session_id: auth_refresh_session
title: Auth refresh queue rationale

## message auth_fact_1
The rejected design was one global mutex around all auth refresh work.

## message auth_fact_2
The global mutex was rejected because auth_refresh_different_tenants_parallel showed unrelated tenants must not block each other.

## message auth_fact_3
RefreshQueue uses a per-tenant key: same-tenant duplicate refreshes coalesce, while different tenants continue in parallel.
