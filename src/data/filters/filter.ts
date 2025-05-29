import { Acked } from "../logData/logSchema";

export type Filter = {
    id: string;
    messageRegex: string;
    transient?: boolean; // default false
    autoAck?: boolean; //default true
};

export type FilterMatched = {
    filterId: string;
    acked: Acked;
}

export type FilterMatchResult = FilterMatched | undefined;

export type FilterMatcher = {
    match: (line: {messages: string[]}) => FilterMatchResult;
}

export function createFilterMatcher(filter: Filter): FilterMatcher {
    const regex = new RegExp(filter.messageRegex);
    let ackMarker: Acked;

    if (filter.transient === true) {
        ackMarker = { type: 'manual' };
    } else if (filter.autoAck === false) {
        ackMarker = null;
    } else {
        ackMarker = { type: 'filter', filterId: filter.id };
    }

    const ifMatched: FilterMatched = {
        filterId: filter.id,
        acked: ackMarker,
    };
    
    return {
        match: (line: {messages: string[]}): FilterMatched | undefined => {
            for (const msg of line.messages) {
                const matches = regex.test(msg);
                if (matches) {
                    return ifMatched
                }
            }
            return undefined;
        }
    };
}

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