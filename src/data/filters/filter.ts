export type Filter = {
    id: string;
    messageRegex: string;
    transient?: boolean; // default false
    autoAck?: boolean; //default true
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