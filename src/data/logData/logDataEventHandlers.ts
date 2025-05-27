import { current } from '@reduxjs/toolkit';
import { Acked, JustReceivedLog, Log } from '@/data/logData/logSchema';
import _ from 'lodash';
import { Filter, FilterMatcher, FilterMatchResult, FilterStats, makeFilterMatcher, saveFilterStatsToStorage } from '../filters/filter';
import { LogDataState } from './logDataSlice';


export type BatchToProcess = {
  logs: JustReceivedLog[],
  filters: Filter[],
}

export function handleNewLogsBatch(state: LogDataState, batch: BatchToProcess): void {

  const newRecords: JustReceivedLog[] = [];
  for (const newRecord of batch.logs) {
    const isDuplicate = recordWhetherDuplicate(state, newRecord)
    if (!isDuplicate) {
      newRecords.push(newRecord);
    }
  }

  const matchers: Array<{matcher: FilterMatcher, filterId: string}> = batch.filters.map(filter => ({matcher: makeFilterMatcher(filter), filterId: filter.id}))


  const linePredicates = batch.filters.map(filter => ({regex: RegExp(filter.messageRegex), filterId: filter.id}))
  for (const log of newRecords) {
      for (const linePredicate of linePredicates) {
          if (linePredicate.regex.test(log.source.message)) {
              log.acked = {type: 'filter', filterId: linePredicate.filterId}
              break
          }
      }
  }

  const newRecordsAdapted = newRecords.map(({ stream, id, source, timestamp}) => {

    const matchedFilters: Array<{filterId: string, acked: Acked}> = [];
    for (const m of matchers) {
      const {matcher} = m
      const match: FilterMatchResult = matcher({
        timestamp,
        messages: [source.message],
      })
      //TODO: bark on triple assignment missing
      if (match.matched === 'yes' && 'acked' in match) {
        matchedFilters.push({
          filterId: m.filterId,
          acked: match.acked
        })
      }
    }

    const filters = matchedFilters.reduce<Record<string, string>>((acc, { filterId }) => {
      acc[filterId] = filterId;
      return acc;
    }, {});

    let acked = matchedFilters.find(mf => mf.acked !== null && mf.acked.type === 'filter')?.acked
    if (!acked) {
      acked = matchedFilters.find(mf => mf.acked !== null)?.acked
    }

    return {
      stream,
      id,
      line: source.message,
      timestamp,
      acked: acked === undefined ? null : acked,
      filters,
      sourcesAndMessages: [source]
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

function recordWhetherDuplicate(state: LogDataState, newRecord: JustReceivedLog): boolean {

  const existingRecords = state.index[newRecord.id];
  if (!existingRecords) {
    //simplest and the most common case: we just got a new record
    state.index[newRecord.id] = [{
      stream: newRecord.stream,
      id: newRecord.id,
      sourceIds: [newRecord.source.sourceId]
    }];
    return false
  }
  const sameDataRecord = existingRecords.find((r) => _.isEqual(r.stream, newRecord.stream));
  if (sameDataRecord) {
    // a duplicate. Need to record if came from different source.
    if (!sameDataRecord.sourceIds.includes(newRecord.source.sourceId)) {
      sameDataRecord.sourceIds.push(newRecord.source.sourceId)
      // full scan on id and then narrow down on stream equality
      const logsEntries = state.logs.filter(l => l.id === newRecord.id && _.isEqual(l.stream, newRecord.stream))
      logsEntries.forEach(l => {
        l.sourcesAndMessages.push(newRecord.source)
      });
    }
    return true;
  } else {
    // somewhat unexpected the same id (ts in loki) returned records with different streams AFAIU values    
    state.index[newRecord.id].push({
      stream: newRecord.stream,
      id: newRecord.id,
      sourceIds: [newRecord.source.sourceId],
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
