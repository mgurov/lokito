import { LogWithSource } from "@/data/logData/logSchema";
import { useState } from "react";

export default function LogListTest() {
  return (
    <>
      <h2>Here goes the log list</h2>
      <LogList data={generateLogData()} />
    </>
  );
}

function generateLogData(): LogWithSource[] {
  const simpleData = Array.from({ length: 100 }).map((_, i) => ({
    stream: {
      key1: "value1",
      key2: "value2",
    },
    id: i + "_abracadabra",
    line: "something happened " + i,
    timestamp: new Date().toISOString(),
    acked: null,
    filters: {},
    sourcesAndMessages: [
      { sourceId: "s1", message: "something happened " + i },
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
  } as LogWithSource));

  return simpleData;
}

interface LogListProps {
  data: LogWithSource[];
}

function LogList({ data }: LogListProps) {
  return (
    <div className="bg-white shadow sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {data.map(logEntry => (
          <li key={logEntry.id}>
            <LogEntry
              logEntry={logEntry}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

const LogEntry = ({ logEntry }: { logEntry: LogWithSource }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="border-b border-gray-200">
      <div
        className="px-4 py-4 sm:px-6 cursor-pointer hover:bg-gray-50"
        onClick={toggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-900">
            <div className="font-semibold">{logEntry.timestamp}</div>
            <div>{logEntry.line}</div>
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className="px-4 py-2 sm:px-6 bg-gray-50">
          <div className="text-sm text-gray-600">
            {JSON.stringify(logEntry.stream, null, 2)}
          </div>
        </div>
      )}
    </div>
  );
};
