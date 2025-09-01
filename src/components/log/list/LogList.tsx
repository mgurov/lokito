import { Button } from "@/components/ui/shadcn/button";
import { LogWithSource } from "@/data/logData/logSchema";
import { simpleDateTimeFormat } from "@/lib/utils";

import { useSelectedSourceMessageLine } from "@/components/context/SelectedSourceContext";
import { RuleEditorContextProvider } from "@/components/rule/ruleEditorContext";
import { useState } from "react";
import { MemoedLogRowPanel } from "../LogPanel";
import { FilterIndicators } from "./FilterIndicators";
import { RowAck } from "./RowAck";
import { SourceIndicator } from "./SourceIndicator";
import { TraceIndicators } from "./TraceIndicators";

type LogListProps = {
  data: LogWithSource[];
} & DisplayOptions;

type DisplayOptions = {
  hideTraces?: boolean;
  hideFilterId?: string;
};

const DATA_WINDOW_INCREMENT = 20;

export function LogList(props: LogListProps) {
  return (
    <RuleEditorContextProvider>
      <LogListBare {...props} />
    </RuleEditorContextProvider>
  );
}

function LogListBare({ data, ...displayOpts }: LogListProps) {
  const [dataWindow, setDataWindow] = useState(DATA_WINDOW_INCREMENT);
  return (
    <div className="bg-white shadow sm:rounded-md transition-colors">
      <div className="flex flex-col">
        {data.length === 0 && <div className="h-12 text-center">Clean ✅</div>}
        {data.map((logEntry, index) => {
          if (index > dataWindow) {
            return null;
          }
          if (index === dataWindow) {
            const remainingCount = data.length - dataWindow;
            const message = remainingCount > DATA_WINDOW_INCREMENT
              ? `Show ${DATA_WINDOW_INCREMENT} more of ${remainingCount} remaining...`
              : `Show remaining ${remainingCount}...`;
            return (
              <Button
                key="show_more"
                data-testid="show-more-button"
                variant={"outline"}
                onClick={() => setDataWindow(w => w + DATA_WINDOW_INCREMENT)}
              >
                {message}
              </Button>
            );
          }
          return <LogEntry key={logEntry.id} logEntry={logEntry} {...displayOpts} />;
        })}
      </div>
    </div>
  );
}

const LogEntry = ({ logEntry, hideTraces, hideFilterId }: { logEntry: LogWithSource } & DisplayOptions) => {
  const stringToShow = useSelectedSourceMessageLine(logEntry);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="border-b border-gray-200" data-testid="log-table-row">
      <div
        className="cursor-pointer hover:bg-gray-50 whitespace-nowrap select-none"
        onClick={toggleExpand}
      >
        {/* main line */}
        <div
          className="flex items-center text-xs font-medium text-gray-900 gap-1 border-l-2 pl-2 border-solid"
          style={{ borderColor: logEntry.sources[0]?.color }}
          data-testid="log-table-row-header"
        >
          <div className="w-6">
            <RowAck buttonClassName="w-6 h-6" logId={logEntry.id} acked={logEntry.acked} />
          </div>

          <SourceIndicator row={logEntry} />

          <FilterIndicators row={logEntry} hideFilterId={hideFilterId} />

          {!hideTraces && <TraceIndicators row={logEntry} />}

          <div className="w-32 tracking-tight" title={logEntry.timestamp}>
            {simpleDateTimeFormat(logEntry.timestamp)}
          </div>
          <div className="text-ellipsis overflow-hidden" data-testid="log-message">
            {stringToShow}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-2 py-2 bg-gray-50">
          <div className="px-2 text-sm text-gray-600">
            {stringToShow}
          </div>
          <MemoedLogRowPanel log={logEntry} excludeFilterId={hideFilterId} />
        </div>
      )}
    </div>
  );
};
