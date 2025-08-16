import { Log } from "@/data/logData/logSchema";
import { traceIdFields } from "@/lib/traceIds";
import { reverseDeleteFromArray } from "@/lib/utils";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import _ from "lodash";
import { createFilterMatcher, FiltersLocalStorage, FilterStats } from "../filters/filter";
import { createFilter, deleteFilter } from "../filters/filtersSlice";
import { deleteSource } from "../redux/sourcesSlice";
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
      } | {
        type: "filterId";
        filterId: string;
      } | {
        type: "traceId";
        traceId: string;
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
        case "filterId":
          ackingPredicate = (l: Log) => !!l.filters[payload.filterId];
          break;
        case "traceId":
          {
            const traceIdLogIds = state.traceIdIndex[payload.traceId];
            if (!traceIdLogIds) {
              return;
            }
            ackingPredicate = (l: Log) => traceIdLogIds.includes(l.id);
          }
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

    builder.addCase(deleteSource, (state, action) => {
      const sourceId = action.payload;
      const logsToRemove = new Array<Log>();
      for (const log of state.logs) {
        reverseDeleteFromArray(log.sourcesAndMessages, scm => scm.sourceId === sourceId);
        if (log.sourcesAndMessages.length === 0) {
          logsToRemove.push(log);
        }
      }
      for (const log of logsToRemove) {
        const index = state.logs.findIndex(l => l.id === log.id);
        if (index !== -1) {
          state.logs.splice(index, 1);
        }

        delete state.deduplicationIndex[log.id]; // technically might be a bit too large

        for (const { traceIdValue } of traceIdFields(log)) {
          const recordsByTrace = state.traceIdIndex[traceIdValue];
          if (recordsByTrace) {
            if (recordsByTrace.length <= 1) {
              delete state.traceIdIndex[traceIdValue];
            } else {
              reverseDeleteFromArray(recordsByTrace, id => id === log.id);
            }
          }
        }
      }
    });
  },
});

export const { receiveBatch, ack, unack } = logDataSlice.actions;

export const logDataSliceActions = logDataSlice.actions;

export default logDataSlice.reducer;
