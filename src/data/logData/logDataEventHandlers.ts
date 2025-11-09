import { Acked, FilterLogNote, JustReceivedLog, Log } from "@/data/logData/logSchema";
import { traceIdFields } from "@/lib/traceIds";
import _ from "lodash";
import { createFilterMatcher, Filter, FiltersLocalStorage, FilterStats } from "../filters/filter";
import { LogDataState, TraceRecord } from "./logDataSlice";

export type JustReceivedBatch = {
  logs: JustReceivedLog[];
  filters: Filter[];
  sourceId: string;
  fetchCycle: number;
};

export function handleNewLogsBatch(state: LogDataState, justReceivedBatch: JustReceivedBatch): void {
  const newRecords: JustReceivedLog[] = [];
  for (const newRecord of justReceivedBatch.logs) {
    const isDuplicate = recordWhetherDuplicate(state, newRecord, justReceivedBatch.sourceId);
    if (!isDuplicate) {
      newRecords.push(newRecord);
    }
  }

  const matchers = justReceivedBatch.filters.map(createFilterMatcher);

  const newRecordsAdapted = newRecords.map(({ stream, id, message, timestamp }) => {
    const filtersMatched: Record<string, FilterLogNote> = {};
    let acked: Acked = null;

    for (const matcher of matchers) {
      const thisMatch = matcher.match({ messages: [{ message }], timestamp });
      if (thisMatch) {
        filtersMatched[thisMatch.filterNote.filterId] = thisMatch.filterNote;
        if (acked === null) {
          acked = thisMatch.acked;
        }
      }
    }

    return {
      stream,
      id,
      timestamp,
      acked,
      filters: filtersMatched,
      sourcesAndMessages: [{ sourceId: justReceivedBatch.sourceId, message }],
      fetchCycle: justReceivedBatch.fetchCycle,
    } as Log;
  });

  state.logs = [...state.logs, ...newRecordsAdapted].sort((a, b) => (a.id > b.id ? -1 : 1));

  const toApresAck = updateTraceIdIndex(state.traceIdIndex, newRecordsAdapted);

  apresAck(state.logs, toApresAck);

  updateFilterStats(state.filterStats, newRecordsAdapted);
}

export function apresAck(logs: Log[], toApresAck: Record<string, FilterLogNote>) {
  if (Object.keys(toApresAck).length > 0) {
    for (const log of logs) {
      const toAckThisLogFilter = toApresAck[log.id];
      if (!toAckThisLogFilter) {
        continue;
      }
      if (!log.filters[toAckThisLogFilter.filterId]) {
        log.filters[toAckThisLogFilter.filterId] = toAckThisLogFilter;
      }
      if (log.acked === null && toAckThisLogFilter.autoAck) {
        log.acked = { type: "filter", filterId: toAckThisLogFilter.filterId };
      }
    }
  }
}

/**
 * updates traceIndex based on the newRedords and returns the list of ids of records to apres-update based on the trace fields matchers
 */
function updateTraceIdIndex(
  traceIdIndex: Record<string, TraceRecord>,
  newRecords: Log[],
): Record<string, FilterLogNote> // by logId
{
  // to the proper result
  const toAck = new Array<[string, FilterLogNote]>();

  for (const rec of newRecords) {
    const thisRecordTraceCapturingFilters = Object.values(rec.filters).filter(f => f.captureWholeTrace);
    const thisRecordTraceCapturingFiltersMap = Object.fromEntries(
      thisRecordTraceCapturingFilters.map(f => [f.filterId, f]),
    );
    for (const { traceIdValue } of traceIdFields(rec)) {
      const existingTraceRecord = traceIdIndex[traceIdValue];
      if (existingTraceRecord) {
        // TODO: do we need to do these precautions or could just pushed back on the apres-administration?
        { // apres-ack newly added record if already existing trace-spanning filters
          for (const previouslyExistingFilter of Object.values(existingTraceRecord.capturingFilters)) {
            if (previouslyExistingFilter.filterId in thisRecordTraceCapturingFiltersMap) {
              continue;
            }
            toAck.push([rec.id, previouslyExistingFilter]);
          }
        }

        { // record previously known trace records to apres-ack
          for (const newFilter of thisRecordTraceCapturingFilters) {
            if (!newFilter.captureWholeTrace) {
              continue;
            }
            if (newFilter.filterId in existingTraceRecord.capturingFilters) {
              continue;
            }
            for (const toAckLogId of existingTraceRecord.logIds) {
              toAck.push([toAckLogId, newFilter]);
            }
            existingTraceRecord.capturingFilters[newFilter.filterId] = newFilter;
          }
        }
        existingTraceRecord.logIds.push(rec.id);
      } else {
        traceIdIndex[traceIdValue] = {
          capturingFilters: thisRecordTraceCapturingFiltersMap,
          logIds: [rec.id],
        };
      }
    }
  }

  return Object.fromEntries(toAck);
}

export function updateFilterStats(filterStats: FilterStats, newRecords: Log[]) {
  // the first step might be overcaution about the piling up updates in immer for many hits.
  const filterCounts: Record<string, number> = {};
  for (const record of newRecords) {
    if (record.acked && record.acked.type === "filter") {
      const filterId = record.acked.filterId;
      filterCounts[filterId] = (filterCounts[filterId] || 0) + 1;
    }
  }
  for (const [filterId, count] of Object.entries(filterCounts)) {
    filterStats[filterId] = (filterStats[filterId] || 0) + count;
  }

  FiltersLocalStorage.filterStats.save(filterStats);
}

function recordWhetherDuplicate(state: LogDataState, newRecord: JustReceivedLog, sourceId: string): boolean {
  const existingRecords = state.deduplicationIndex[newRecord.id];
  if (!existingRecords) {
    // simplest and the most common case: we just got a new record
    state.deduplicationIndex[newRecord.id] = [{
      stream: newRecord.stream,
      id: newRecord.id,
      sourceIds: [sourceId],
    }];
    return false;
  }
  const sameDataRecord = existingRecords.find((r) => _.isEqual(r.stream, newRecord.stream));
  if (sameDataRecord) {
    // a duplicate. Need to record if came from different source.
    if (!sameDataRecord.sourceIds.includes(sourceId)) {
      sameDataRecord.sourceIds.push(sourceId);
      // full scan on id and then narrow down on stream equality
      const logsEntries = state.logs.filter(l => l.id === newRecord.id && _.isEqual(l.stream, newRecord.stream));
      logsEntries.forEach(l => {
        l.sourcesAndMessages.push({ message: newRecord.message, sourceId });
      });
    }
    return true;
  } else {
    // somewhat unexpected the same id (ts in loki) returned records with different streams AFAIU values
    state.deduplicationIndex[newRecord.id].push({
      stream: newRecord.stream,
      id: newRecord.id,
      sourceIds: [sourceId],
    });
    console.warn(
      "Duplicate log id with different stream; existing:  ",
      // threw exceptions on me: current(existingRecords[0]),
      existingRecords[0],
      "new:",
      newRecord,
    );
    return false;
  }
}
