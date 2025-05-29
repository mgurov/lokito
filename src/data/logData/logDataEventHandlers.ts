import { current } from '@reduxjs/toolkit';
import { Acked, JustReceivedLog, Log } from '@/data/logData/logSchema';
import _ from 'lodash';
import { Filter, FilterStats, saveFilterStatsToStorage } from '../filters/filter';
import { LogDataState } from './logDataSlice';

export type JustReceivedBatch = {
  logs: JustReceivedLog[];
  filters: Filter[];
  sourceId: string;
}

export function handleNewLogsBatch(state: LogDataState, justReceivedBatch: JustReceivedBatch): void {

  const newRecords: JustReceivedLog[] = [];
  for (const newRecord of justReceivedBatch.logs) {
    const isDuplicate = recordWhetherDuplicate(state, newRecord, justReceivedBatch.sourceId)
    if (!isDuplicate) {
      newRecords.push(newRecord);
    }
  }

  const linePredicates = justReceivedBatch.filters.map(filter => ({regex: RegExp(filter.messageRegex), filterId: filter.id}))
  

  const newRecordsAdapted = newRecords.map(({ stream, id, message, timestamp }) => {

    let acked: Acked = null;
    for (const linePredicate of linePredicates) {
      if (linePredicate.regex.test(message)) {
        acked = {type: 'filter', filterId: linePredicate.filterId}
        break
      }
    }

    return {
      stream,
      id,
      line: message,
      timestamp,
      acked,
      filters: acked && acked.type === 'filter' ? {[acked.filterId]: acked.filterId} : {},
      sourcesAndMessages: [{sourceId: justReceivedBatch.sourceId, message}],
    } as Log
  })
  state.logs = [...state.logs, ...newRecordsAdapted].sort((a, b) => (a.id > b.id ? -1 : 1));

  updateFilterStats(state.filterStats, newRecordsAdapted)
}

export function updateFilterStats(filterStats: FilterStats, newRecords: Log[]) {
  //the first step might be overcaution about the piling up updates in immer for many hits.
  const filterCounts: Record<string, number> = {}
  for (const record of newRecords) {
    if (record.acked && record.acked.type === 'filter') {
      const filterId = record.acked.filterId;
      filterCounts[filterId] = (filterCounts[filterId] || 0) + 1;
    }
  }
  for (const [filterId, count] of Object.entries(filterCounts)) {
    filterStats[filterId] = (filterStats[filterId] || 0) + count;
  }

  saveFilterStatsToStorage(filterStats)
}

function recordWhetherDuplicate(state: LogDataState, newRecord: JustReceivedLog, sourceId: string): boolean {

  const existingRecords = state.index[newRecord.id];
  if (!existingRecords) {
    //simplest and the most common case: we just got a new record
    state.index[newRecord.id] = [{
      stream: newRecord.stream,
      id: newRecord.id,
      sourceIds: [sourceId]
    }];
    return false
  }
  const sameDataRecord = existingRecords.find((r) => _.isEqual(r.stream, newRecord.stream));
  if (sameDataRecord) {
    // a duplicate. Need to record if came from different source.
    if (!sameDataRecord.sourceIds.includes(sourceId)) {
      sameDataRecord.sourceIds.push(sourceId)
      // full scan on id and then narrow down on stream equality
      const logsEntries = state.logs.filter(l => l.id === newRecord.id && _.isEqual(l.stream, newRecord.stream))
      logsEntries.forEach(l => {
        l.sourcesAndMessages.push({message: newRecord.message, sourceId});
      });
    }
    return true;
  } else {
    // somewhat unexpected the same id (ts in loki) returned records with different streams AFAIU values    
    state.index[newRecord.id].push({
      stream: newRecord.stream,
      id: newRecord.id,
      sourceIds: [sourceId],
    });
    console.warn(
      'Duplicate log id with different stream; existing:  ',
      current(existingRecords[0]),
      'new:',
      newRecord,
    );
    return false;
  }

}
