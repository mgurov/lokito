type SourceAndMessage = {
  sourceId: string,
  message: string,
}

export type Acked = null | {type: 'manual'} | {type: 'filter', filterId: string};

export type JustReceivedLog = {
  stream: { [key: string]: unknown };
  id: string;
  timestamp: string;
  message: string;
}

export type Log = {
  stream: { [key: string]: unknown };
  id: string;
  line: string;
  timestamp: string;
  acked: Acked;
  filters: Record<string, string>;
  sourcesAndMessages: [SourceAndMessage, ...SourceAndMessage[]]
};

export type LogSource = {
  color: string, name: string, id: string
}

export type LogWithSource = Log & 
  {
    sources: [LogSource, ...LogSource[]];
  }
