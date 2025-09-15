import { LogList } from "@/components/log/list/LogList";
import { LogWithSource } from "@/data/logData/logSchema";

export default function LogListTest() {
  return (
    <>
      <h2>Here goes the log list</h2>
      <LogList data={generateLogData()} />
    </>
  );
}

function generateLogData(): LogWithSource[] {
  const simpleData = Array.from({ length: 100 }).map((_, i) => {
    const line = i === 10
      ? "something very long decimal happened" + (Array.from({ length: 100 }).map((_, j) => `element ${j}`).join("."))
      : "something happened " + i;
    return {
      stream: {
        key1: "value1",
        key2: "value2",
      },
      id: i + "_abracadabra",
      line,
      timestamp: new Date().toISOString(),
      acked: null,
      filters: {},
      sourcesAndMessages: [
        { sourceId: "s1", message: line },
        { sourceId: "s2", message: "something happened here as well " + i },
      ],
      sources: [{
        color: "red",
        name: "source 1",
        id: "s1",
      }, {
        color: "blue",
        name: "source 2",
        id: "s2",
      }],
    } as LogWithSource;
  });

  return simpleData;
}
