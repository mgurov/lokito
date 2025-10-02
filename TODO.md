[ ] imporant: alert of handle exceeding the limit of 1000...
[ ] bug: doesn't catch the second non-acking filter when getting new records

[ ] handle error on too long of a range

[ ] don't show clean when error or pending

[ ] filter by a field
[ ] notes on a message w/o filter

[ ] rename filter to rule

[ ] create filter from user selection 

[ ] preview filter appliance

[ ] continue fetch after first non-acked

[ ] force fetch cycle

[ ] link to Tempo

[ ] ? staging area ? don't show the logs fetched in a cycle until all done and cross-referenced. Resilience might suffer though. 

[ ] persist in the session storage / db of the browser w. GC

[ ] visual examples

[ ] zod to validate the server schema

[ ] log generator 
    https://github.com/QuesmaOrg/blog-5-ways-to-get-started-with-grafana/tree/main/03_logs_with_loki/log-generator 
    via https://quesma.com/blog-detail/5-grafana-docker-examples-to-get-started-with-metrics-logs-and-traces 

## before "release"

[ ] configuraiton 
    [v] url
    [ ] trace fields 
[v] multiple loki URLs 
[ ] warn on log saturation (>1K)

## points

[ ] MVP - error handling. Like the check of the 1000 messages ingested not overspilled.