import { Log } from "@/data/logData/logSchema";
import { TRACE_ID_FIELDS } from "@/hardcodes";

// returns deduplicated traceId values with a first field mentioned it
export function traceIdFields(log: Log): Array<{ traceIdField: string; traceIdValue: string }> {
  const deduplicationIndex: Record<string, string> = {};
  const result = [];
  for (const traceIdField of TRACE_ID_FIELDS) {
    const traceIdValue = log.fields[traceIdField];
    if (!traceIdValue) {
      continue;
    }
    if (deduplicationIndex[traceIdValue]) {
      continue;
    }
    deduplicationIndex[traceIdValue] = traceIdValue;
    result.push({ traceIdField, traceIdValue });
  }
  return result;
}
