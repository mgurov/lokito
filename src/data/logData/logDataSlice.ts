import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { Acked, JustReceivedLog, Log } from '@/data/logData/logSchema';
import { createFilter } from '../filters/filtersSlice';
import _ from 'lodash';
import { FilterStats, loadFilterStatsFromStorage, saveFilterStatsToStorage } from '../filters/filter';
import { handleNewLogsBatch } from './logDataEventHandlers';

type LogIndexNode = {
  stream: { [key: string]: unknown };
  id: string;
  sourceIds: [string, ...string[]];
}

export interface LogDataState {
  logs: Log[];
  index: Record<string, LogIndexNode[]>;
  filterStats: FilterStats;
}

const initialState: LogDataState = {
  logs: [],
  index: {},
  filterStats: loadFilterStatsFromStorage(),
};

export const logDataSlice = createSlice({
  name: 'logData',
  initialState,
  reducers: {
    receiveBatch: (state, action: PayloadAction<JustReceivedLog[]>) => {
      handleNewLogsBatch(state, action.payload)
    },
    ack: (state, action: PayloadAction<string>) => {
      const line = state.logs.find((l) => l.id === action.payload);
      if (line) {
        line.acked = {type: 'manual'};
      } else {
        console.error("Couldn't find log by id to ack; action: ", action);
      }
    },
    ackTillThis: (state, action: PayloadAction<{ messageId: string, sourceId?: string }>) => {
      const { sourceId, messageId } = action.payload;
      const lineIndex = state.logs.findIndex((l) => l.id === messageId);
      if (lineIndex === -1) {
        console.error("Couldn't find log by id to ack; action: ", action);
        return;
      }
      state.logs.forEach((l, index) => {
        if (index >= lineIndex && (sourceId === undefined || l.sourcesAndMessages.find(s => s.sourceId === sourceId))) {
          l.acked = {type: 'manual'};
        }
      })
    },
    ackAll: (state, { payload: sourceId }: PayloadAction<string | undefined>) => {
      state.logs.forEach(l => {
        if (sourceId === undefined || l.sourcesAndMessages.find(s => s.sourceId === sourceId)) {
          l.acked = {type: 'manual'};
        }
      })
    },
  },
  extraReducers: (builder) => {
    // TODO: handle deletion of a filter
    builder.addCase(createFilter, (state, action) => {
      const filter = action.payload;
      const predicate = RegExp(filter.messageRegex);
      let matched = 0
      const ackMarker: Acked = filter.transient ? {type: 'manual'} : { type: 'filter', filterId: filter.id };
      for (const line of state.logs) {
        if (line.acked) {
          continue;
        }
        if (undefined !== line.sourcesAndMessages.find(sm => predicate.test(sm.message))) {
          line.acked = ackMarker;
          matched += 1;
        }
      }
      if (!filter.transient && matched > 0) {
        state.filterStats[filter.id] = matched
        saveFilterStatsToStorage(state.filterStats)
      }
    });
  },
});

export const { receiveBatch, ack } = logDataSlice.actions;

export const logDataSliceActions = logDataSlice.actions;

export default logDataSlice.reducer;