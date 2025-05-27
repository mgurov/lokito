import { Acked } from "../logData/logSchema";

export type Filter = {
    id: string;
    messageRegex: string;
    transient?: boolean; // default false
    autoAck?: boolean; //default true
    autoAckTillDate?: string;
};

const NO_MATCH = { matched: 'no' };

//TODO: replace no_match with no acked?
export type FilterMatchResult = {
    matched: 'yes',
    acked: Acked,
} | typeof NO_MATCH;

export type LineForMatching = {
    messages: string[],
    timestamp: string,
}

export type FilterMatcher = (line: LineForMatching) => FilterMatchResult;

export function makeFilterMatcher(filter: Filter): FilterMatcher {
    const messagePredicate = RegExp(filter.messageRegex);
    const ackMarker: Acked = filter.transient ? {type: 'manual'} : { type: 'filter', filterId: filter.id };
    const ackPredicate = ackPredicateByDate(filter);

    return (line: LineForMatching): FilterMatchResult => {


        const thisLineMatched = undefined !== line.messages.find(sm => messagePredicate.test(sm))

        if (!thisLineMatched) {
          return NO_MATCH
        }

        return {
            matched: 'yes',
            acked: ackPredicate(line.timestamp) ? ackMarker : null,
        }      
    }

}

export function ackPredicateByDate({autoAckTillDate, autoAck}: Filter): (timestamp: string) => boolean {
    if (autoAck === false) {
        return () => false
    }
    if (!autoAckTillDate) {
        return () => true;
    }
    const cutoff = new Date(autoAckTillDate).toISOString()
    return (timestamp: string) => {
        // expect to work lexicographically because ISO strings both
        return (cutoff >= timestamp)
    }

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