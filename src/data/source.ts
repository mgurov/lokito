export type SourceMutation = {
    name: string;
    query: string;
    color: string;
};

export type Source = SourceMutation & {
    createdAt: string;
    id: string;
    lastUpdate: string;
    active: boolean;
    color: string;
};


const IS_SERVER = typeof window === 'undefined';
const SOURCES_STORAGE_KEY = 'sources';
export function loadSourcesFromStorage(): Source[] {
    const sourcesJson = IS_SERVER ? undefined : localStorage.getItem(SOURCES_STORAGE_KEY);
    const result = sourcesJson ? JSON.parse(sourcesJson) as Source[] : [];
    for (const source of result) {
        source.active = source.active ?? true; //backwards compatibility
    }
    return result;
}

export function saveSourcesToStorage(sources: Source[]) {
    if (!IS_SERVER) {
        localStorage.setItem(SOURCES_STORAGE_KEY, JSON.stringify(sources));
    }
}
