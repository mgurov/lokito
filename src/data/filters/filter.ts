export type Filter = {
    id: string;
    messageRegex: string;
    transient?: boolean;
    //TODO: do we want to make Filters specific to sources? Maybe list of sourceIds to apply to.
};


//TODO: unify with sources?
const IS_SERVER = typeof window === 'undefined';
const FILTERS_STORAGE_KEY = 'filters';
export function loadSourcesFromStorage(): Filter[] {
    const storedJson = IS_SERVER ? undefined : localStorage.getItem(FILTERS_STORAGE_KEY);
    return storedJson ? JSON.parse(storedJson) as Filter[] : [];
}

export function saveSourcesToStorage(filters: Filter[]) {
    if (!IS_SERVER) {
        localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
    }
}