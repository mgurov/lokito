import { createSelector } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import { Log, LogWithSource } from '@/data/logData/logSchema';
import { RootState } from '../redux/store';
import _ from 'lodash';

export const useData = (acked: boolean): LogWithSource[] =>
    useSelector(
        createSelector(
            [(state: RootState) => state.logData.logs, (state: RootState) => state.sources.data],
            (logs, sources) => {
                const ackFilter = acked ? (log: Log) => log.acked != null : (log: Log) => log.acked == null
                return logs
                    .filter(ackFilter)
                    .map((log) => ({
                        ...log,
                        sources: log.sourcesAndMessages.map(({ sourceId }) => ({
                            id: sources[sourceId].id,
                            color: sources[sourceId].color,
                            name: sources[sourceId].name,
                        }))
                    } as LogWithSource))
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
            (logs) => logs.filter((log) => log.acked && log.acked.type === 'filter' && log.acked.filterId === filterId).length,
        ),
    );

export const useFilterTotalCount = (filterId: string) =>
    useSelector(
        createSelector(
            [(state: RootState) => state.logData.filterStats],
            (filterStats) => filterStats[filterId] ?? 0
        ),
    );