export type Log = {
  stream: { [key: string]: unknown };
  id: string;
  line: string;
  timestamp: string;
  acked: boolean;
  sourceId: string;
  // TODO: New type for the composition of log and source
  sources: {
    id: string;
    color: string;
  };
};
