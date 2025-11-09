import { Button } from "@/components/ui/shadcn/button";
import { CheckIcon, CopyIcon } from "@radix-ui/react-icons";
import { ReactNode, useContext, useState } from "react";

import { GoogleIcon } from "@/components/ui/icons/GoogleIcon";
import { useFilters } from "@/data/filters/filtersSlice";
import { logDataSliceActions } from "@/data/logData/logDataSlice";
import { Log } from "@/data/logData/logSchema";
import { TRACE_ID_FIELDS } from "@/hardcodes";
import React from "react";
import { useDispatch } from "react-redux";
import { SelectedSourceContext, useSelectedSourceMessageLine } from "../context/SelectedSourceContext";
import FilterCard from "../rule/FilterCard";
import { RuleEditorActionContext as RuleEditorActionsContext } from "../rule/ruleEditorContext";
import SimpleTooltip from "../ui/custom/SimpleTooltip";

export function MemoedLogRowPanel({ log, excludeFilterId }: { log: Log; excludeFilterId?: string }) {
  const { stream, ...lessMutable } = log;
  const memoKey = JSON.stringify(lessMutable);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useMemo(() => <LogPanel log={log} excludeFilterId={excludeFilterId} />, [memoKey, excludeFilterId]);
}

export function LogPanel({ log, excludeFilterId }: { log: Log; excludeFilterId?: string }) {
  return (
    <>
      <div className="space-y-2">
        <div className="flex w-full px-2">
          <FilterLikeThisButton log={log} />

          <AckTillThisButton messageId={log.id} />
        </div>

        <RenderFilters log={log} excludeFilterId={excludeFilterId} />

        <div className="space-y-1 px-3 py-2">
          <h3 className="text-sm font-semibold">Fields</h3>
          <div className="grid rounded-sm bg-white shadow">
            <div className="grid cursor-default grid-cols-[auto_1fr] gap-2 px-4 py-2 text-xs">
              <RenderFields log={log} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function RenderFilters({ log, excludeFilterId }: { log: Log; excludeFilterId?: string }) {
  const filters = useFilters();

  const thisLineFilters = filters.filter(f => excludeFilterId !== f.id && log.filters[f.id]);

  if (thisLineFilters.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1 px-3 py-2">
      <h3 className="text-sm font-semibold">Filter(s)</h3>
      <div className="grid rounded-sm bg-white shadow">
        <div className="flex flex-wrap gap-4 px-4 py-2 text-xs">
          {thisLineFilters.map(f => <FilterCard key={f.id} filter={f} />)}
        </div>
      </div>
    </div>
  );
}

function RenderFields(props: { log: Log }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  function handleCopyToClipboard(value: string, field: string) {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
      })
      .catch(console.error);
  }
  const fields = Object.keys(props.log.stream);

  return (
    <>
      {fields.map((field) => (
        <React.Fragment key={field}>
          <div
            className={"overflow-hidden text-ellipsis" + (TRACE_ID_FIELDS.includes(field) ? " font-semibold" : "")}
            title={field}
          >
            {field}
          </div>
          <div className="group flex">
            {props.log.stream?.[field] !== undefined && (
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleCopyToClipboard(props.log.stream?.[field], field)}
                className="h-4 w-0 border-none bg-transparent text-gray-600 opacity-0 transition-opacity group-hover:opacity-100 group-hover:w-4"
                title={copiedField === field ? "Copied!" : "Copy"}
              >
                {copiedField === field ? <CheckIcon /> : <CopyIcon />}
                <span className="sr-only">Copy Order ID</span>
              </Button>
            )}
            <span>{props.log.stream?.[field] as ReactNode}</span>
          </div>
        </React.Fragment>
      ))}
    </>
  );
}

function AckTillThisButton({ messageId }: { messageId: string }) {
  const selectedSource = useContext(SelectedSourceContext);
  const dispatch = useDispatch();
  const { ackTillThis } = logDataSliceActions;

  return (
    <SimpleTooltip content={<p>All messages up to this event will be ACK'ed.</p>}>
      <Button
        size="sm"
        variant="outline"
        data-testid="ack-till-this"
        className="ml-1 mt-1"
        onClick={() => {
          dispatch(ackTillThis({ messageId, sourceId: selectedSource?.sourceId }));
        }}
      >
        ACK till here
      </Button>
    </SimpleTooltip>
  );
}

function FilterLikeThisButton({ log }: { log: Log }) {
  const actions = useContext(RuleEditorActionsContext);
  const logLine = useSelectedSourceMessageLine(log);
  return (
    <Button
      className="ml-1 mt-1"
      size="sm"
      variant="outline"
      data-testid="new-rule-button"
      disabled={!actions}
      onClick={() => {
        if (!actions) {
          return;
        }
        actions.open({ sourceLine: logLine, fieldsData: log.stream });
      }}
    >
      <GoogleIcon icon="filter-alt" /> Filter like this...
    </Button>
  );
}
