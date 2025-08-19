import { Acked, FilterLogNote } from "../logData/logSchema";

export type Filter = {
  id: string;
  messageRegex: string;
  transient?: boolean; // default false
  autoAck?: boolean; // default true
  autoAckTillDate?: string;
  description?: string;
  captureWholeTrace?: boolean; // default false
};

export type FilterMatched = {
  filterNote: FilterLogNote;
  acked: Acked;
};

export type FilterMatchResult = FilterMatched | undefined;

export type FilterMatcher = {
  match: (line: { messages: string[]; timestamp: string }) => FilterMatchResult;
};

export type FilterStats = Record<string, number>;

export function createFilterMatcher(filter: Filter): FilterMatcher {
  const regex = new RegExp(filter.messageRegex);
  const captureWholeTrace = filter.captureWholeTrace ?? false;

  const acker: (line: { timestamp: string }) => Acked | null = (() => {
    if (filter.autoAck === false) {
      return () => null;
    } else if (filter.autoAckTillDate) {
      const autoAckTillDate = new Date(filter.autoAckTillDate);
      return (line) => {
        const lineDate = new Date(line.timestamp);
        return lineDate <= autoAckTillDate ? { type: "filter", filterId: filter.id } : null;
      };
    } else {
      return () => ({ type: "filter", filterId: filter.id });
    }
  })();

  return {
    match: (line: { messages: string[]; timestamp: string }): FilterMatched | undefined => {
      for (const msg of line.messages) {
        const matches = regex.test(msg);
        if (matches) {
          return {
            filterNote: {
              filterId: filter.id,
              captureWholeTrace,
              autoAck: filter.autoAck ?? true, // TODO: solve the problem of spreading defaults.
            },
            acked: acker(line),
          };
        }
      }
      return undefined;
    },
  };
}

export const FiltersLocalStorage = {
  filters: {
    STORAGE_KEY: "filters",
    load(): Filter[] {
      const storedJson = localStorage.getItem(this.STORAGE_KEY);
      const result = storedJson ? JSON.parse(storedJson) as Filter[] : [];
      return result;
    },
    save(filters: Filter[]) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filters));
    },
  },
  filterStats: {
    STORAGE_KEY: "filters_stats",

    load(): FilterStats {
      const storedJson = localStorage.getItem(this.STORAGE_KEY);
      return storedJson ? JSON.parse(storedJson) as FilterStats : {};
    },

    save(filters: FilterStats) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filters));
    },
  },
};
