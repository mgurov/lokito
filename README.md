# Start

having the loki logs exposed via http://localhost:9996 (e.g. `iptiq-cli -sproxy grafana.ss:9996` )

`npm run boot`


# LGTM stack 

`docker run -p 3000:3000 -p 4317:4317 -p 4318:4318 --rm -ti grafana/otel-lgtm` as per [their blog](https://hub.docker.com/r/grafana/otel-lgtm)

Then run an [example](https://github.com/grafana/docker-otel-lgtm/tree/main/examples/nodejs) 

loki: `logcli query --from="2025-07-11T10:00:00Z" --output=jsonl '{service_name="dice-server"}' `