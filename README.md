# Universal Internet Engine

A real network measurement and optimization platform. The current branch establishes the first operational measurement node and browser measurement client.

## Non-negotiable telemetry rules

- No seeded metrics, demo values, fabricated users, synthetic latency, or assumed connection status.
- A metric is shown only after a real request or transfer has completed and its bytes/time have been observed.
- The download endpoint generates benchmark bytes; those bytes are actually transferred over the network. They are not pre-filled speed results or application content.
- HTTP probe failure ratio is explicitly labelled as HTTP probe failure ratio, not IP packet loss.
- No automatic "repair" or acceleration claim is shown unless a real platform-specific operation exists and its result is verified.

## First operational component

The Fastify measurement node exposes health, HTTP probe, download-stream, and upload-receipt endpoints. The React client measures RTT with the browser monotonic clock and measures throughput using confirmed transferred byte counts and elapsed time.

See [server/README.md](server/README.md) for configuration and API details.

## Run locally

```sh
npm install
npm run dev
```

In another terminal:

```sh
npm run server
```

Configure `VITE_MEASUREMENT_API_URL` to the exact measurement-node origin and add the frontend origin to `ALLOWED_ORIGINS`. Do not publish measurements until the deployed endpoint is reachable from the actual client network.

## Container deployment

Build and run the measurement node:

```sh
docker build -t universal-internet-measurement .
docker run --rm -p 8080:8080 -e ALLOWED_ORIGINS=https://YOUR-FRONTEND-ORIGIN universal-internet-measurement
```

## Current scope

Implemented: one real HTTP measurement node, browser RTT probes, measured download/upload throughput, no-data initial UI, HTTP integration smoke test, TypeScript and frontend build checks.

Not implemented: global edge network, anycast routing, adaptive route switching, QUIC relay, WireGuard gateway, multipath bonding, IP-layer telemetry, native device agents, OpenWrt agent, or traffic acceleration. The project must not label these capabilities as active until their implementations are deployed and verified.
