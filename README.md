# arch-agent

<!--ARCH-START-->

```mermaid
%% updated: 2025-11-02T20:38:13.440Z
flowchart LR
  subgraph Backend
    api_gateway["api-gateway"]
    cron["cron"]
    db_main[(db.main)]
    frontend["frontend"]
    nginx["nginx"]
    payments["payments"]
    queue["queue"]
    redis["redis"]
    users["users"]
    worker["worker"]
  end
```

<!--ARCH-END-->