import { PayloadAction, createSelector, createSlice, current, isDraft } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import { Log } from '@/data/schema';
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
        const existingRecordsProxy = state.index[newRecord.id];
        const existingRecords = existingRecordsProxy ? (isDraft(existingRecordsProxy) ? current(existingRecordsProxy) : existingRecordsProxy)  : [];
        const sameStreamRecord = existingRecords.find((r) => _.isEqual(r.stream, newRecord.stream));
        if (!sameStreamRecord) {
          state.index[newRecord.id] = [...existingRecords, newRecord];
          newRecords.push(newRecord);
          if (existingRecords.length > 0) {
            console.warn(
              'Duplicate log id with different stream; existing:  ',
              existingRecords[0],
              'new:',
              newRecord,
            );
          }
        }
      }
      state.logs = [...state.logs, ...newRecords].sort((a, b) => (a.id > b.id ? -1 : 1));
    },
    ack: (state, action: PayloadAction<string>) => {
      const line = state.logs.find((l) => l.id === action.payload);
      if (line) {
        line.acked = true;
      } else {
        console.warn("Couldn't find log by id to ack; action: ", action);
      }
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

export default logDataSlice.reducer;

export const useUnackedData = () =>
  useSelector(
    createSelector(
      [(state: RootState) => state.logData.logs, (state: RootState) => state.sources.data],
      (logs, sources) =>
        logs
          .filter((log) => !log.acked)
          .map((log) => ({
            ...log,
            source: {
              id: sources[log.sourceId].id,
              color: sources[log.sourceId].color,
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
