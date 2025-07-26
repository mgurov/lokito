# Config


## iptiq

having the loki logs exposed via http://localhost:9996 (e.g. `iptiq-cli -sproxy grafana.ss:9996` )

`cp .env.iptiq .env` once

## general public

Once after checkout copy and adjust : `cp .env.example .env`. By default, it will point to the LGTM stack exposed as explained below.

# Start in preview mode

`npm run boot` - will check the latest code out, install the deps and start the preview server locally. 

# LGTM stack 

`docker run -p 3000:3000 -p3100:3100 -p 4317:4317 -p 4318:4318 --rm -ti grafana/otel-lgtm` as per [their blog](https://hub.docker.com/r/grafana/otel-lgtm)

Then run an [example](https://github.com/grafana/docker-otel-lgtm/tree/main/examples/nodejs)  : `curl "http://127.0.0.1:8084/rolldice?rolls=5"`

loki: `logcli query --from="2025-07-11T10:00:00Z" --output=jsonl '{service_name="dice-server"}' `