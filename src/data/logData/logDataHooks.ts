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
          if (matches.length == 1) {
            continue; // one count is us perhaps, not interesting
          }
          result[traceIdValue] = matches.length;
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
        (state: RootState) => state.logData.traceIdIndex[traceId],
        (state: RootState) => state.sources.data,
      ],
      (all, toShow, sources) => {
        return all.filter((log) => {
          return (toShow || []).some((match) => match === log.id);
        }).map(enrichLogWithSourcesFun(sources));
      },
    ),
  );

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
