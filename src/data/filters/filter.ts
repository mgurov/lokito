import { Acked } from "../logData/logSchema";

export type Filter = {
    id: string;
    messageRegex: string;
    transient?: boolean; // default false
    autoAck?: boolean; //default true
    autoAckTillDate?: string;
};

export type FilterMatched = {
    filterId: string;
    acked: Acked;
}

export type FilterMatchResult = FilterMatched | undefined;

export type FilterMatcher = {
    match: (line: {messages: string[], timestamp: string}) => FilterMatchResult;
}

export function createFilterMatcher(filter: Filter): FilterMatcher {
    const regex = new RegExp(filter.messageRegex);

    const acker: (line: {timestamp: string}) => Acked | null = (() => {
        if (filter.autoAck === false) {
            return () => null;
        } else if (filter.autoAckTillDate) {
            const autoAckTillDate = new Date(filter.autoAckTillDate);
            return (line) => {
                const lineDate = new Date(line.timestamp);
                return lineDate <= autoAckTillDate ? { type: 'filter', filterId: filter.id } : null;
            };
        } else {
            return () => ({ type: 'filter', filterId: filter.id });
        }
    })();
        
    return {
        match: (line: {messages: string[], timestamp: string}): FilterMatched | undefined => {
            for (const msg of line.messages) {
                const matches = regex.test(msg);
                if (matches) {
                    return {
                        filterId: filter.id,
                        acked: acker(line),
                    }
                }
            }
            return undefined;
        }
    };
};

const IS_SERVER = typeof window === 'undefined';
const FILTERS_STORAGE_KEY = 'filters';
export function loadFiltersFromStorage(): Filter[] {
    const storedJson = IS_SERVER ? undefined : localStorage.getItem(FILTERS_STORAGE_KEY);
    return storedJson ? JSON.parse(storedJson) as Filter[] : [];
}

export function saveFiltersToStorage(filters: Filter[]) {
    if (!IS_SERVER) {
        localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
    }
}

export type FilterStats = Record<string, number>

export const FILTERS_STATS_STORAGE_KEY = 'filters_stats';

export function loadFilterStatsFromStorage(): FilterStats {
    const storedJson = IS_SERVER ? undefined : localStorage.getItem(FILTERS_STATS_STORAGE_KEY);
    return storedJson ? JSON.parse(storedJson) as FilterStats : {};
}

export function saveFilterStatsToStorage(filters: FilterStats) {
    if (!IS_SERVER) {
        localStorage.setItem(FILTERS_STATS_STORAGE_KEY, JSON.stringify(filters));
    }
}