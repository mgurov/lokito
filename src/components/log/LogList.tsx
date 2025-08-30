import { FilterIndicators, RowAck, SourceIndicator, TraceIndicators } from "@/components/columns";
import { MemoedLogRowPanel } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { LogWithSource } from "@/data/logData/logSchema";
import { simpleDateTimeFormat } from "@/lib/utils";

import { useState } from "react";

interface LogListProps {
  data: LogWithSource[];
}

const WINDOW_INCREMENT = 20; // TODO: cover with a test

export function LogList({ data }: LogListProps) {
  const [window, setWindow] = useState(WINDOW_INCREMENT);
  return (
    <div className="bg-white shadow sm:rounded-md transition-colors">
      <div className="flex flex-col">
        {data.map((logEntry, index) => {
          if (index > window) {
            return null;
          }
          if (index === window) {
            {/* TODO */}
            return (
              <Button key="show_more" variant={"outline"} onClick={() => setWindow(w => w + WINDOW_INCREMENT)}>
                Show more...
              </Button>
            );
          }
          return <LogEntry key={logEntry.id} logEntry={logEntry} />;
        })}
      </div>
    </div>
  );
}

const LogEntry = ({ logEntry }: { logEntry: LogWithSource }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  /*
  TODO:
  rm h-full
  move text-xs font-medium up
  */

  return (
    <div className="border-b border-gray-200">
      <div
        className="cursor-pointer hover:bg-gray-50 whitespace-nowrap select-none"
        onClick={toggleExpand}
      >
        {/* main line */}
        <div
          className="flex items-center text-sm font-medium text-gray-900 gap-1 border-l-2 pl-2 border-solid"
          style={{ borderColor: "#ce3131ff" }}
        >
          <div className="w-6">
            <RowAck buttonClassName="w-6 h-6" logId={logEntry.id} acked={logEntry.acked} />
          </div>

          <SourceIndicator row={logEntry} />

          <FilterIndicators row={logEntry} hideFilterId={undefined} />

          {/*showTraces*/ <TraceIndicators row={logEntry} />}

          <div className="h-full w-32 text-xs tracking-tight" title={logEntry.timestamp}>
            {simpleDateTimeFormat(logEntry.timestamp)}
          </div>
          <div className="h-full text-xs font-medium text-ellipsis overflow-hidden">
            {logEntry.line}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 py-2 sm:px-6 bg-gray-50">
          <div className="text-sm text-gray-600">
            {logEntry.line}
          </div>
          <MemoedLogRowPanel log={logEntry} />
        </div>
      )}
    </div>
  );
};
