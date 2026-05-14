# Billing queue global mutex decision
session_id: ses_1e09f82afffeGzCXfohH1G0T4a
title: Billing queue global mutex decision
id_policy: cite the heading message id below, not fixture fact labels

## message msg_e1f607d630018RVBY9GlvxVQXE
- Billing retry queues used a global mutex because provider limits required serializing all tenants.
- Do not copy this billing retry design into auth refresh queues unless the current task explicitly asks for billing provider serialization.
