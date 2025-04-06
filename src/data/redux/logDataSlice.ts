import { PayloadAction, createSelector, createSlice } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import { Log, LogWithSource } from '@/data/schema';
import { RootState } from './store';
import { createFilter } from '../filters/filtersSlice';
import _ from 'lodash';

export interface LogDataReceived {
  logs: Log[];
}

export interface LogDataState {
  logs: Log[];
  index: Record<string, Log[]>;
}

const initialState: LogDataState = {
  logs: [],
  index: {},
};

export const logDataSlice = createSlice({
  name: 'logData',
  initialState,
  reducers: {
    receiveBatch: (state, action: PayloadAction<LogDataReceived>) => {
      const newRecords = [];
      for (const newRecord of action.payload.logs) {
        const existingRecords = state.index[newRecord.id];
        if (!existingRecords) {
          //simplest and the most common case: we just got a new record
          newRecords.push(newRecord);
          state.index[newRecord.id] = [newRecord];
          continue;
        }
        const sameStreamRecord = existingRecords.find((r) => _.isEqual(r.stream, newRecord.stream));
        if (!sameStreamRecord) {
          newRecords.push(newRecord);
          state.index[newRecord.id].push(newRecord);
          console.warn(
            'Duplicate log id with different stream; existing:  ',
            existingRecords[0],
            'new:',
            newRecord,
          );
        }
      }
      state.logs = [...state.logs, ...newRecords].sort((a, b) => (a.id > b.id ? -1 : 1));
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
        if (index >= lineIndex && (sourceId === undefined || l.sourceId === sourceId)) {
          l.acked = true;
        }
      })      
     },
    ackAll: (state, {payload: sourceId}: PayloadAction<string | undefined>) => {
      state.logs.forEach(l => {
        if (sourceId === undefined || l.sourceId === sourceId) {
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
        line.acked = predicate.test(line.line);
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
            source: {
              id: sources[log.sourceId].id,
              color: sources[log.sourceId].color,
              name: sources[log.sourceId].name,
            },
          })),
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
  
