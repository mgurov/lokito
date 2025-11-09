import { Acked, FilterLogNote } from "../logData/logSchema";

export type Filter = {
  id: string;
  messageRegex: string;
  transient?: boolean; // default false
  autoAck?: boolean; // default true
  autoAckTillDate?: string;
  description?: string;
  captureWholeTrace: boolean;
  field: string | undefined;
};

export type FilterMatched = {
  filterNote: FilterLogNote;
  acked: Acked;
};

export type FilterMatchResult = FilterMatched | undefined;

export type LineToFilterMatch = {
  sourcesLines: { message: string }[];
  fieldValues: Record<string, string>;
  timestamp: string;
};

export type FilterMatcher = {
  match: (line: LineToFilterMatch) => FilterMatchResult;
};

export type FilterStats = Record<string, number>;

export type FilterForMatching = Pick<
  Filter,
  | "id"
  | "messageRegex"
  | "captureWholeTrace"
  | "autoAck"
  | "autoAckTillDate"
  | "field"
>;

export function createFilterMatcher(filter: FilterForMatching): FilterMatcher {
  const regex = new RegExp(filter.messageRegex);
  const captureWholeTrace = filter.captureWholeTrace;

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
    match: (line: LineToFilterMatch): FilterMatched | undefined => {
      let matches = false;
      if (filter.field) {
        const thisFieldValue = line.fieldValues[filter.field];
        if (thisFieldValue) {
          matches = regex.test(thisFieldValue);
        }
      } else {
        for (const msg of line.sourcesLines) {
          const thisSourceLineMatched = regex.test(msg.message);
          if (thisSourceLineMatched) {
            matches = true;
            break;
          }
        }
      }
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
      const resultDefaulted = result.map(f => Object.assign({ captureWholeTrace: true }, f));
      return resultDefaulted;
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
