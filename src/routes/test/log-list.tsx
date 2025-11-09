import { LogList } from "@/components/log/list/LogList";
import { LogSource, LogWithSource, SourceAndMessage } from "@/data/logData/logSchema";

export default function LogListTest() {
  return (
    <>
      <h2>Here goes the log list</h2>
      <LogList data={generateLogData()} />
    </>
  );
}

function generateLogData(): LogWithSource[] {
  const s1 = {
    color: "red",
    name: "source 1",
    id: "s1",
  };

  const s2 = {
    color: "blue",
    name: "source 2",
    id: "s2",
  };

  const s3 = {
    color: "#1cc0e1ff",
    name: "source with longer name",
    id: "s3",
  };

  const sourceCombos: [LogSource, ...LogSource[]][] = [
    [s1],
    [s2],
    [s3],
    [s1, s2],
    [s2, s3],
    [s1, s2, s3],
  ];

  const simpleData = Array.from({ length: 100 }).map((_, i) => {
    const sources = sourceCombos[i % 6];
    const line = i === 10
      ? "something very long decimal happened" + (Array.from({ length: 100 }).map((_, j) => `element ${j}`).join("."))
      : "something happened " + i;
    return {
      stream: {
        key1: "value1",
        key2: "value2",
      },
      id: i + "_abracadabra",
      timestamp: new Date().toISOString(),
      acked: null,
      filters: {},
      sourcesAndMessages: sources.map((source, sourceIndex) => {
        return {
          sourceId: source.id,
          message: sourceIndex == 0 ? line : "something happened here as well " + i,
        };
      }) as [SourceAndMessage, ...SourceAndMessage[]],
      fetchCycle: 0,
      sources,
    } as LogWithSource;
  });

  return simpleData;
}
