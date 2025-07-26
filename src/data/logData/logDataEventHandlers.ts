import { JustReceivedLog, Log } from "@/data/logData/logSchema";
import { traceIdFields } from "@/lib/traceIds";
import _ from "lodash";
import { createFilterMatcher, Filter, FilterMatchResult, FiltersLocalStorage, FilterStats } from "../filters/filter";
import { LogDataState } from "./logDataSlice";

export type JustReceivedBatch = {
  logs: JustReceivedLog[];
  filters: Filter[];
  sourceId: string;
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
    const anyMatched = matchers.reduce((acc, matcher) => {
      // stop reducing if we already found a match
      if (acc) {
        return acc;
      }
      return matcher.match({ messages: [message], timestamp });
    }, undefined as FilterMatchResult);

    return {
      stream,
      id,
      line: message,
      timestamp,
      acked: anyMatched ? anyMatched.acked : null,
      filters: anyMatched ? { [anyMatched.filterId]: anyMatched.filterId } : {},
      sourcesAndMessages: [{ sourceId: justReceivedBatch.sourceId, message }],
    } as Log;
  });

  state.logs = [...state.logs, ...newRecordsAdapted].sort((a, b) => (a.id > b.id ? -1 : 1));

  updateTraceIdIndex(state.traceIdIndex, newRecordsAdapted);

  updateFilterStats(state.filterStats, newRecordsAdapted);
}

function updateTraceIdIndex(traceIdIndex: Record<string, string[]>, newRecords: Log[]) {
  for (const rec of newRecords) {
    for (const { traceIdValue } of traceIdFields(rec)) {
      if (traceIdIndex[traceIdValue]) {
        traceIdIndex[traceIdValue].push(rec.id);
      } else {
        traceIdIndex[traceIdValue] = [rec.id];
      }
    }
  }
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
