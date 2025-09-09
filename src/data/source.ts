export type SourceMutation = {
  name: string;
  query: string;
  color: string;
  datasource: string | undefined; // undefined for historical reasons; might consider ditching after main consumers upgrade.
};

export type Source = SourceMutation & {
  createdAt: string;
  id: string;
  lastUpdate: string;
  active: boolean;
  color: string;
};

const SOURCES_STORAGE_KEY = "sources";

export const SourceLocalStorage = {
  sources: {
    load: (): Source[] => {
      const sourcesJson = localStorage.getItem(SOURCES_STORAGE_KEY);
      const result = sourcesJson ? JSON.parse(sourcesJson) as Source[] : [];
      for (const source of result) {
        source.active = source.active ?? true; // backwards compatibility
      }
      return result;
    },
    save: (sources: Source[]) => {
      localStorage.setItem(SOURCES_STORAGE_KEY, JSON.stringify(sources));
    },
  },

  lastSuccessFrom: {
    load: (sourceId: string): string | null => {
      return localStorage.getItem(SourceLocalStorage.lastSuccessFrom.key(sourceId));
    },
    save: (sourceId: string, at: string) => {
      localStorage.setItem(SourceLocalStorage.lastSuccessFrom.key(sourceId), at);
    },
    key: (sourceId: string): string => {
      return "source-last-success-" + sourceId;
    },
  },
};
