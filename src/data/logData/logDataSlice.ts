import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { Acked, Log } from '@/data/logData/logSchema';
import { createFilter, deleteFilter, ackMatchedByFilter } from '../filters/filtersSlice';
import _ from 'lodash';
import { createFilterMatcher, FilterStats, loadFilterStatsFromStorage, saveFilterStatsToStorage } from '../filters/filter';
import { handleNewLogsBatch, JustReceivedBatch } from './logDataEventHandlers';

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
    receiveBatch: (state, action: PayloadAction<JustReceivedBatch>) => {
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
    builder.addCase(createFilter, (state, action) => {
      const filter = action.payload;
      const matcher = createFilterMatcher(filter);
      let matched = 0
      for (const line of state.logs) {

        const lineMatched = matcher.match({timestamp: line.timestamp, messages: line.sourcesAndMessages.map(sm => sm.message)});

        if (!lineMatched) {
          continue;
        }
      

        if (line.filters[lineMatched.filterId] !== undefined) {
          continue;
        }

        matched += 1;
        line.filters[lineMatched.filterId] = lineMatched.filterId;
        
        if (line.acked === null) {
          line.acked = lineMatched.acked;
        }
      }

      if (!filter.transient && matched > 0) {
        state.filterStats[filter.id] = matched
        saveFilterStatsToStorage(state.filterStats)
      }
    });

    builder.addCase(deleteFilter, (state, action) => {
      const filterId = action.payload

      // 1. unack affected lines

      for (const line of state.logs) {
        const {acked} = line
        if (acked?.type === 'filter' && acked.filterId === filterId) {
          line.acked = null
        }
      }

      // 2. clear stats
      delete state.filterStats[filterId]
      saveFilterStatsToStorage(state.filterStats)

    })


    builder.addCase(ackMatchedByFilter, (state, action) => {
      const filterId = action.payload
      const ackMarker: Acked = { type: 'filter', filterId: filterId };

      // unack affected lines
      for (const line of state.logs) {
        if (line.acked === null && line.filters[filterId] !== undefined) {
          line.acked = ackMarker;
        }
      }
    })

  },
});

export const { receiveBatch, ack } = logDataSlice.actions;

export const logDataSliceActions = logDataSlice.actions;

export default logDataSlice.reducer;