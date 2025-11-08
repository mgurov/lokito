export type SourceAndMessage = {
  sourceId: string;
  message: string;
};

export type Acked = null | { type: "manual" } | { type: "filter"; filterId: string };

export type JustReceivedLog = {
  stream: { [key: string]: unknown };
  id: string;
  timestamp: string; // iso string
  message: string;
};

export type FilterLogNote = {
  filterId: string;
  captureWholeTrace: boolean;
  autoAck: boolean;
};

export type Log = {
  stream: { [key: string]: string };
  id: string;
  line: string; // TODO: consider dropping in favour of the sourcesAndMessages. or at least rename :firstSourcesMessage
  timestamp: string; // iso string
  acked: Acked;
  filters: Record<string, FilterLogNote>;
  sourcesAndMessages: [SourceAndMessage, ...SourceAndMessage[]];
  fetchCycle: number;
};

export type LogSource = {
  color: string;
  name: string;
  id: string;
};

export type LogWithSource =
  & Log
  & {
    sources: [LogSource, ...LogSource[]];
  };
