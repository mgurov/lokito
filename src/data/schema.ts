type SourceAndMessage = {
  sourceId: string,
  message: string,
}

export type JustReceivedLog = {
  stream: { [key: string]: unknown };
  id: string;
  timestamp: string;
  source: SourceAndMessage;
  acked: boolean;
}

export type Log = {
  stream: { [key: string]: unknown };
  id: string;
  line: string;
  timestamp: string;
  acked: boolean;
  sourcesAndMessages: [SourceAndMessage, ...SourceAndMessage[]]
};

export type LogSource = {
  color: string, name: string, id: string
}

export type LogWithSource = Log & 
  {
    sources: [LogSource, ...LogSource[]];
  }
