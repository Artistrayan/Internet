# Implementation status

## Implemented in this branch

- Fastify HTTP measurement node with health, uncached probe, exact-length download stream, and upload receipt endpoints.
- Browser client measures round-trip HTTP time with performance.now(), computes observed HTTP probe failure ratio, and computes upload/download throughput from transferred byte counts and elapsed time.
- Dashboard starts with no metric values and no assumed stability score.
- Removed the previous heuristic dashboard engines and simulated auto-fix routines.
- Added a CI workflow for TypeScript checks, frontend build, and HTTP integration checks.

## Not yet implemented

- Publicly deployed measurement nodes and production origin configuration.
- Regional global edge network and route selection.
- Packet-level loss/jitter measurement outside browser HTTP probes.
- Multipath bonding, QUIC relay, WireGuard gateway, congestion-control tuning.
- Native Android, desktop, and OpenWrt agents.
- Any traffic acceleration or ISP-path optimization.

Do not mark any unimplemented item as active. Do not report measured values until the browser client has successfully contacted a configured live measurement node.
