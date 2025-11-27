import { FilterLogNote, Log } from "@/data/logData/logSchema";
import { traceIdFields } from "@/lib/traceIds";
import { reverseDeleteFromArray, setDeduct } from "@/lib/utils";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import _ from "lodash";
import { createFilterMatcher, FiltersLocalStorage, FilterStats } from "../filters/filter";
import { createFilter, deleteFilter } from "../filters/filtersSlice";
import { deleteSource } from "../redux/sourcesSlice";
import { apresAck, handleNewLogsBatch, JustReceivedBatch } from "./logDataEventHandlers";

export type LogIndexNode = {
  stream: { [key: string]: unknown };
  id: string;
  sourceIds: [string, ...string[]];
};

export interface LogDataState {
  logs: Log[];
  deduplicationIndex: Record<string, LogIndexNode[]>;
  traceIdIndex: Record<string, TraceRecord>;
  filterStats: FilterStats;
  justAcked: Set<string>;
  justUnacked: Set<string>;
}

export type TraceRecord = {
  logIds: string[];
  capturingFilters: Record<string, FilterLogNote>;
};

const initialState: LogDataState = {
  logs: [],
  deduplicationIndex: {},
  traceIdIndex: {},
  filterStats: FiltersLocalStorage.filterStats.load(),
  justAcked: new Set(),
  justUnacked: new Set(),
};

export const logDataSlice = createSlice({
  name: "logData",
  initialState,
  reducers: {
    receiveBatch: (state, action: PayloadAction<JustReceivedBatch>) => {
      handleNewLogsBatch(state, action.payload);
    },
    cleanAcked: (state, action: PayloadAction<Set<string>>) => {
      state.justAcked = setDeduct(state.justAcked, action.payload);
    },
    cleanUnacked: (state, action: PayloadAction<Set<string>>) => {
      state.justUnacked = setDeduct(state.justUnacked, action.payload);
    },
    unack: (state, action: PayloadAction<string>) => {
      const line = state.logs.find((l) => l.id === action.payload);
      if (line) {
        line.acked = null; // hard unack even if were matched by a filter we don't care anymore. TODO: check what happens in that case.
        state.justUnacked.add(action.payload);
      } else {
        console.error("Couldn't find log by id to ack; action: ", action);
      }
    },
    ack: (state, { payload }: PayloadAction<
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
      } | {
        type: "ackTillThis";
        messageId: string;
        sourceId?: string;
      }
    >) => {
      let ackingPredicate: (l: Log, index: number) => boolean;

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
            ackingPredicate = (l: Log) => traceIdLogIds.logIds.includes(l.id);
          }
          break;
        case "ackTillThis":
          {
            const { sourceId, messageId } = payload;
            const lineIndex = state.logs.findIndex((l) => l.id === messageId);
            if (lineIndex === -1) {
              console.error("Couldn't find log by id to ack; action: ", payload);
              return;
            }
            ackingPredicate = (l: Log, index: number) => {
              if (index < lineIndex) {
                return false;
              }
              if (sourceId === undefined) {
                return true;
              }
              return l.sourcesAndMessages.find(s => s.sourceId === sourceId) !== undefined;
            };
          }
          break;

        default:
          console.error("Unknown acking payload type", payload);
          return;
      }

      state.logs.forEach((l, index) => {
        if (ackingPredicate(l, index)) {
          l.acked = { type: "manual" };
          state.justAcked.add(l.id);
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder.addCase(createFilter, (state, action) => {
      const filter = action.payload;
      const matcher = createFilterMatcher(filter);
      let matched = 0;
      const linesToSpreadByTraceId = {} as Record<string, FilterLogNote>;
      for (const line of state.logs) {
        const lineMatched = matcher.match({
          sourcesLines: line.sourcesAndMessages,
          timestamp: line.timestamp,
          fieldValues: line.fields,
        });

        if (!lineMatched) {
          continue;
        }

        if (line.filters[lineMatched.filterNote.filterId] !== undefined) {
          continue;
        }

        matched += 1;
        line.filters[lineMatched.filterNote.filterId] = lineMatched.filterNote;

        if (line.acked === null) {
          line.acked = lineMatched.acked;
        }
        if (filter.captureWholeTrace) {
          for (const { traceIdValue } of traceIdFields(line)) {
            // TODO: update the filter list
            for (const potentialSpread of state.traceIdIndex[traceIdValue].logIds) {
              if (potentialSpread === line.id) {
                continue;
              }
              linesToSpreadByTraceId[potentialSpread] = lineMatched.filterNote;
            }
          }
        }
      }

      apresAck(state.logs, linesToSpreadByTraceId);

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
            if (recordsByTrace.logIds.length <= 1) {
              delete state.traceIdIndex[traceIdValue];
            } else {
              reverseDeleteFromArray(recordsByTrace.logIds, id => id === log.id);
            }
          }
        }
      }
    });
  },
});

export const { receiveBatch, unack, ack } = logDataSlice.actions;

export const logDataSliceActions = logDataSlice.actions;

export default logDataSlice.reducer;
