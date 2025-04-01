import { PayloadAction, createSelector, createSlice, current } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import { JustReceivedLog, Log, LogWithSource } from '@/data/schema';
import { RootState } from './store';
import { createFilter } from '../filters/filtersSlice';
import _ from 'lodash';

type LogIndexNode = {
    stream: { [key: string]: unknown };
    id: string;
    sourceIds: [string, ...string[]];
}

export interface LogDataState {
  logs: Log[];
  index: Record<string, LogIndexNode[]>;
}

const initialState: LogDataState = {
  logs: [],
  index: {},
};

export const logDataSlice = createSlice({
  name: 'logData',
  initialState,
  reducers: {
    receiveBatch: (state, action: PayloadAction<JustReceivedLog[]>) => {
      const newRecords: JustReceivedLog[] = [];
      for (const newRecord of action.payload) {
        const existingRecords = state.index[newRecord.id];
        if (!existingRecords) {
          //simplest and the most common case: we just got a new record
          newRecords.push(newRecord);
          state.index[newRecord.id] = [{
            stream: newRecord.stream,
            id: newRecord.id,
            sourceIds: [newRecord.source.sourceId]
          }];
          continue;
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
        } else {
          // somewhat unexpected the same id (ts in loki) returned records with different streams AFAIU values
          newRecords.push(newRecord);
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
        }
      }
      const newRecordsAdapted = newRecords.map(({stream, id, source, timestamp, acked}) => (
        {
          stream, 
          id, 
          line: source.message, 
          timestamp, 
          acked, 
          sourcesAndMessages: [source]
        } as Log
      ))
      state.logs = [...state.logs, ...newRecordsAdapted].sort((a, b) => (a.id > b.id ? -1 : 1));
    },
    ack: (state, action: PayloadAction<string>) => {
      const line = state.logs.find((l) => l.id === action.payload);
      if (line) {
        line.acked = true;
      } else {
        console.error("Couldn't find log by id to ack; action: ", action);
      }
     },
    ackTillThis: (state, action: PayloadAction<{messageId: string, sourceId?: string}>) => {
      const {sourceId, messageId} = action.payload;
      const lineIndex = state.logs.findIndex((l) => l.id === messageId);
      if (lineIndex === -1) {
        console.error("Couldn't find log by id to ack; action: ", action);
        return;
      }
      state.logs.forEach((l, index) => {
        if (index >= lineIndex && (sourceId === undefined || l.sourcesAndMessages.find(s => s.sourceId === sourceId))) {
          l.acked = true;
        }
      })      
     },
    ackAll: (state, {payload: sourceId}: PayloadAction<string | undefined>) => {
      state.logs.forEach(l => {
        if (sourceId === undefined || l.sourcesAndMessages.find(s => s.sourceId === sourceId)) {
          l.acked = true
        }
      })
    },
  },
  extraReducers: (builder) => {
    // TODO: handle deletion of a filter
    builder.addCase(createFilter, (state, action) => {
      const filter = action.payload;
      const predicate = RegExp(filter.messageRegex);
      for (const line of state.logs) {
        if (line.acked) {
          continue;
        }
        line.acked = undefined !== line.sourcesAndMessages.find(sm => predicate.test(sm.message));
      }
    });
  },
});

export const { receiveBatch, ack } = logDataSlice.actions;

export const logDataSliceActions = logDataSlice.actions;

export default logDataSlice.reducer;

export const useData = (acked: boolean): LogWithSource[] =>
  useSelector(
    createSelector(
      [(state: RootState) => state.logData.logs, (state: RootState) => state.sources.data],
      (logs, sources) =>
        logs
          .filter((log) => log.acked === acked)
          .map((log) => ({
            ...log,
            sources: log.sourcesAndMessages.map(({sourceId}) => ({
              id: sources[sourceId].id,
              color: sources[sourceId].color,
              name: sources[sourceId].name,
            }))
          } as LogWithSource)),
    ),
  );

export const useAckedDataLength = () =>
  useSelector(
    createSelector(
      [(state: RootState) => state.logData.logs],
      (logs) => logs.filter((log) => log.acked).length,
    ),
  );

export const useNotAckedDataLength = () =>
  useSelector(
    createSelector(
      [(state: RootState) => state.logData.logs],
      (logs) => logs.filter((log) => !log.acked).length,
    ),
  );
  
