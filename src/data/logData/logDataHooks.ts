import { Log, LogWithSource } from "@/data/logData/logSchema";
import { traceIdFields } from "@/lib/traceIds";
import { createSelector } from "@reduxjs/toolkit";
import _ from "lodash";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { Source } from "../source";

export const useData = (acked: boolean): LogWithSource[] =>
  useSelector(
    createSelector(
      [(state: RootState) => state.logData.logs, (state: RootState) => state.sources.data],
      (logs, sources) => {
        const ackFilter = acked ? (log: Log) => log.acked != null : (log: Log) => log.acked == null;
        return logs
          .filter(ackFilter)
          .map(enrichLogWithSourcesFun(sources));
      },
    ),
  );

export const useAllData = (): LogWithSource[] =>
  useSelector(
    createSelector(
      [(state: RootState) => state.logData.logs, (state: RootState) => state.sources.data],
      (logs, sources) => {
        return logs
          .map(enrichLogWithSourcesFun(sources));
      },
    ),
  );

export const useAckedDataLength = () =>
  useSelector(
    createSelector(
      [(state: RootState) => state.logData.logs],
      (logs) => logs.filter((log) => log.acked !== null).length,
    ),
  );

export const useNotAckedDataLength = () =>
  useSelector(
    createSelector(
      [(state: RootState) => state.logData.logs],
      (logs) => logs.filter((log) => log.acked === null).length,
    ),
  );

export const useFilterHitCount = (filterId: string) =>
  useSelector(
    createSelector(
      [(state: RootState) => state.logData.logs],
      (logs) =>
        logs.filter((log) => log.acked && log.acked.type === "filter" && log.acked.filterId === filterId).length,
    ),
  );

export const useFilterTotalCount = (filterId: string) =>
  useSelector(
    createSelector(
      [(state: RootState) => state.logData.filterStats],
      (filterStats) => filterStats[filterId] ?? 0,
    ),
  );

export const useTraceIdsMultipleMatchesCount = (row: Log): Record<string, number> =>
  useSelector(
    createSelector(
      [(state: RootState) => state.logData.traceIdIndex],
      (traceIdIndex) => {
        const result: Record<string, number> = {};
        for (const { traceIdField, traceIdValue } of traceIdFields(row)) {
          if (result[traceIdField]) {
            continue; // already accounted for
          }
          const matches = traceIdIndex[traceIdValue];
          if (matches == undefined) {
            console.error("Unexpected missing traceIdIndex", traceIdValue, "field", traceIdValue);
            continue;
          }
          if (matches.logIds.length == 1) {
            continue; // one count is us perhaps, not interesting
          }
          result[traceIdValue] = matches.logIds.length;
        }
        return result;
      },
    ),
  );

export const useFilterLogs = (filterId: string): LogWithSource[] =>
  useSelector(
    createSelector(
      [
        (state: RootState) => state.logData.logs,
        (state: RootState) => state.sources.data,
      ],
      (all, sources) => {
        return all.filter((log) => log.filters[filterId]).map(enrichLogWithSourcesFun(sources));
      },
    ),
  );

export const useTraceIdLogs = (traceId: string): LogWithSource[] =>
  useSelector(
    createSelector(
      [
        (state: RootState) => state.logData.logs,
        (state: RootState) => state.logData.traceIdIndex[traceId]?.logIds,
        (state: RootState) => state.sources.data,
      ],
      (all, toShow, sources) => {
        return all.filter((log) => {
          return (toShow || []).some((match) => match === log.id);
        }).map(enrichLogWithSourcesFun(sources));
      },
    ),
  );

// counts string "<unacked>|<acked>|<total>" (each is a number)
export type MatchedCountsString = `${number}|${number}|${number}`;

export const useMatchedAckedUnackedCount = (filter: string): MatchedCountsString =>
  useSelector(
    createSelector(
      [
        (state: RootState) => state.logData.logs,
      ],
      (logs) => countMatched(filter, logs),
    ),
  );

function countMatched(filter: string, logs: Log[]): MatchedCountsString {
  let unacked: number = 0;
  let acked: number = 0;
  let total: number = 0;
  try {
    const matchingRegex = RegExp(filter);
    for (const l of logs) {
      // TODO: try and unite with the other matching
      let matched = false;
      for (const sourceMessage of l.sourcesAndMessages) {
        if (null != matchingRegex.exec(sourceMessage.message)) {
          matched = true;
          break;
        }
      }
      if (!matched) {
        continue;
      }
      total += 1;
      if (l.acked === null) {
        unacked += 1;
      } else {
        acked += 1;
      }
    }
  } catch {
    // failure to build regex perhaps
  }
  return `${unacked}|${acked}|${total}`;
}

function enrichLogWithSourcesFun(sources: { [id: string]: Source }): (log: Log) => LogWithSource {
  return (log: Log): LogWithSource => {
    return {
      ...log,
      sources: log.sourcesAndMessages.map(({ sourceId }) => {
        const { id, color, name } = sources[sourceId];
        return { id, color, name };
      }),
    } as LogWithSource;
  };
}
