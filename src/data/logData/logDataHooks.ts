import { Log, LogWithSource } from "@/data/logData/logSchema";
import { traceIdFields } from "@/lib/traceIds";
import { createSelector } from "@reduxjs/toolkit";
import _ from "lodash";
import { useSelector } from "react-redux";
import { createFilterMatcher } from "../filters/filter";
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

export type FilterOnField = {
  regex: string;
  field: string | undefined;
};

export const useMatchedAckedUnackedCount = (filter: FilterOnField): MatchedCountsString =>
  useSelector(
    createSelector(
      [
        (state: RootState) => state.logData.logs,
      ],
      (logs) => countMatched(filter, logs),
    ),
  );

function countMatched(filter: FilterOnField, logs: Log[]): MatchedCountsString {
  let unacked: number = 0;
  let acked: number = 0;
  let total: number = 0;
  let filterMatcher;

  try {
    filterMatcher = createFilterMatcher({
      id: "never mind",
      messageRegex: filter.regex,
      captureWholeTrace: false,
      field: filter.field,
    });
  } catch (e: unknown) {
    if (e instanceof SyntaxError) {
      // failure to build regex - user problem
      return `${0}|${0}|${0}`;
    }
    throw e;
  }

  for (const l of logs) {
    const matched = filterMatcher.match({
      sourcesLines: l.sourcesAndMessages,
      timestamp: l.timestamp,
      fieldValues: l.fields,
    });
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
