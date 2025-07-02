import { Acked, Log } from "@/data/logData/logSchema";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import _ from "lodash";
import { createFilterMatcher, FiltersLocalStorage, FilterStats } from "../filters/filter";
import { ackMatchedByFilter, createFilter, deleteFilter } from "../filters/filtersSlice";
import { handleNewLogsBatch, JustReceivedBatch } from "./logDataEventHandlers";

export type LogIndexNode = {
  stream: { [key: string]: unknown };
  id: string;
  sourceIds: [string, ...string[]];
};

export interface LogDataState {
  logs: Log[];
  deduplicationIndex: Record<string, LogIndexNode[]>;
  traceIdIndex: Record<string, string[]>; // traceId -> [log.id]
  filterStats: FilterStats;
}

const initialState: LogDataState = {
  logs: [],
  deduplicationIndex: {},
  traceIdIndex: {},
  filterStats: FiltersLocalStorage.filterStats.load(),
};

export const logDataSlice = createSlice({
  name: "logData",
  initialState,
  reducers: {
    receiveBatch: (state, action: PayloadAction<JustReceivedBatch>) => {
      handleNewLogsBatch(state, action.payload);
    },
    ack: (state, action: PayloadAction<string>) => {
      const line = state.logs.find((l) => l.id === action.payload);
      if (line) {
        line.acked = { type: "manual" };
      } else {
        console.error("Couldn't find log by id to ack; action: ", action);
      }
    },
    unack: (state, action: PayloadAction<string>) => {
      const line = state.logs.find((l) => l.id === action.payload);
      if (line) {
        line.acked = null; // hard unack even if were matched by a filter we don't care anymore. TODO: check what happens in that case.
      } else {
        console.error("Couldn't find log by id to ack; action: ", action);
      }
    },
    ackTillThis: (state, action: PayloadAction<{ messageId: string; sourceId?: string }>) => {
      const { sourceId, messageId } = action.payload;
      const lineIndex = state.logs.findIndex((l) => l.id === messageId);
      if (lineIndex === -1) {
        console.error("Couldn't find log by id to ack; action: ", action);
        return;
      }
      state.logs.forEach((l, index) => {
        if (index >= lineIndex && (sourceId === undefined || l.sourcesAndMessages.find(s => s.sourceId === sourceId))) {
          l.acked = { type: "manual" };
        }
      });
    },
    ackAll: (state, { payload }: PayloadAction<
      {
        type: "sourceId";
        sourceId: string | undefined;
      } | {
        type: "ids";
        ids: string[];
      }
    >) => {
      let ackingPredicate: (l: Log) => boolean;

      switch (payload.type) {
        case "sourceId":
          if (payload.sourceId) {
            ackingPredicate = (l: Log) => l.sourcesAndMessages.find(s => s.sourceId === payload.sourceId) != undefined;
          } else {
            ackingPredicate = () => true;
          }
          break;
        case "ids":
          ackingPredicate = (l: Log) => payload.ids.includes(l.id);
          break;
        default:
          console.error("Unknown acking payload type", payload);
          return;
      }

      state.logs.forEach(l => {
        if (ackingPredicate(l)) {
          l.acked = { type: "manual" };
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder.addCase(createFilter, (state, action) => {
      const filter = action.payload;
      const matcher = createFilterMatcher(filter);
      let matched = 0;
      for (const line of state.logs) {
        const lineMatched = matcher.match({
          timestamp: line.timestamp,
          messages: line.sourcesAndMessages.map(sm => sm.message),
        });

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
        state.filterStats[filter.id] = matched;
        FiltersLocalStorage.filterStats.save(state.filterStats);
      }
    });

    builder.addCase(deleteFilter, (state, action) => {
      const filterId = action.payload;

      // 1. unack affected lines

      for (const line of state.logs) {
        const { acked } = line;
        if (acked?.type === "filter" && acked.filterId === filterId) {
          line.acked = null;
        }
      }

      // 2. clear stats
      delete state.filterStats[filterId];
      FiltersLocalStorage.filterStats.save(state.filterStats);
    });

    builder.addCase(ackMatchedByFilter, (state, action) => {
      const filterId = action.payload;
      const ackMarker: Acked = { type: "filter", filterId: filterId };

      // unack affected lines
      for (const line of state.logs) {
        if (line.acked === null && line.filters[filterId] !== undefined) {
          line.acked = ackMarker;
        }
      }
    });
  },
});

export const { receiveBatch, ack, unack } = logDataSlice.actions;

export const logDataSliceActions = logDataSlice.actions;

export default logDataSlice.reducer;
