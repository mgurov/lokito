import { ColumnDef } from "@tanstack/react-table";

import { useTraceIdsMultipleMatchesCount } from "@/data/logData/logDataHooks";
import { ack, logDataSliceActions, unack } from "@/data/logData/logDataSlice";
import { simpleDateTimeFormat } from "@/lib/utils";
import { CheckIcon, MinusIcon } from "@radix-ui/react-icons";
import { useContext } from "react";
import React from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { Acked, LogSource, LogWithSource } from "../data/logData/logSchema";
import { SelectedSourceContext, useSelectedSourceMessageLine } from "./context/SelectedSourceContext";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

function RowAck({ logId, acked }: { logId: string; acked: Acked }) {
  const dispatch = useDispatch();
  const ActionIcon = acked ? MinusIcon : CheckIcon;
  return (
    <Button
      data-testid={acked ? "unack-message-button" : "ack-message-button"}
      size="icon"
      variant="ghost"
      className="hover:bg-gray-200"
      onClick={(e) => {
        const action = acked ? unack : ack;
        dispatch(action(logId));
        e.stopPropagation();
      }}
    >
      <ActionIcon className="h-4 w-4" />
    </Button>
  );
}

export function columns(opts: { showTraces?: boolean; hideFilterId?: string } = {}): ColumnDef<LogWithSource>[] {
  const columnsTemplate: ColumnDef<LogWithSource>[] = [
    {
      id: "source",
      accessorKey: "sources",
      cell: ({ getValue }) => {
        const value = getValue<LogSource[]>();
        return (
          <>
            <div
              className="absolute left-0 top-0 h-full w-[3px]"
              // limitation of tailwind
              style={{ backgroundColor: value[0]?.color }}
            />
          </>
        );
      },
    },
    {
      id: "ack",
      header: undefined,
      cell: ({ row }) => {
        return <RowAck logId={row.original.id} acked={row.original.acked} />;
      },
    },
    {
      accessorKey: "timestamp",
      header: undefined,
      cell: ({ getValue }) => (
        <div className="h-full w-32 cursor-pointer text-xs tracking-tight" title={getValue<string>()}>
          {simpleDateTimeFormat(getValue<string>())}
        </div>
      ),
    },
    {
      accessorKey: "line",
      header: undefined,
      cell: ({ row }) => (
        <RenderLine row={row.original} showTraces={opts.showTraces ?? true} hideFilterId={opts.hideFilterId} />
      ),
    },
  ];

  return columnsTemplate;
}

function RenderLine(
  { row, showTraces, hideFilterId }: { row: LogWithSource; showTraces: boolean; hideFilterId: string | undefined },
) {
  const stringToShow = useSelectedSourceMessageLine(row);
  return (
    <>
      <div className="h-full cursor-pointer overflow-auto whitespace-nowrap text-xs font-medium">
        <SourceIndicator row={row} />
        <FilterIndicators row={row} hideFilterId={hideFilterId} />
        {showTraces && <TraceIndicators row={row} />}
        <span data-testid="log-message">{stringToShow}</span>
      </div>
    </>
  );
}

function SourceIndicator({ row }: { row: LogWithSource }) {
  const selectedSource = useContext(SelectedSourceContext);
  const sourcesToShow = row.sources.filter(s => s.id !== selectedSource?.sourceId);
  return sourcesToShow.map(source => (
    <React.Fragment key={source.id}>
      <Link to={`/logs/${source.id}`}>
        <Button
          variant="ghost"
          size="sm"
          data-testid="log-row-source-marker"
          className="border"
        >
          {source.name}
        </Button>
      </Link>
      {" "}
    </React.Fragment>
  ));
}

function FilterIndicators({ row, hideFilterId }: { row: LogWithSource; hideFilterId: string | undefined }) {
  return Object.entries(row.filters).filter(([id]) => id !== hideFilterId).map(([id, name]) => (
    <React.Fragment key={id}>
      <FilterIndicator id={id} name={name} />
      {" "}
    </React.Fragment>
  ));
}

function FilterIndicator({ id, name }: { id: string; name: string }) {
  const dispatch = useDispatch();
  const { ackAll } = logDataSliceActions;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          data-testid="matching-filter"
          className="border"
        >
          {name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        onClick={e => {
          e.stopPropagation();
        }}
      >
        <DropdownMenuItem
          data-testid="matching-filter-ack-such"
          onClick={_e => {
            dispatch(ackAll({ type: "filterId", filterId: id }));
          }}
        >
          ACK all matched
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={`/filter/${id}`} data-testid="matching-filter-show-such">
            Show all matched
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-gray-500 text-center">
          Rule actions
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TraceIndicators({ row }: { row: LogWithSource }) {
  const traceIdsMultipleMatchesCount = useTraceIdsMultipleMatchesCount(row);
  return Object.entries(traceIdsMultipleMatchesCount).map(([traceId, count]) => (
    <React.Fragment key={traceId}>
      <TraceIndicator traceId={traceId} count={count} />
      {" "}
    </React.Fragment>
  ));
}

function useAckByTraceId(traceId: string) {
  const dispatch = useDispatch();
  const { ackAll } = logDataSliceActions;

  return () => dispatch(ackAll({ type: "traceId", traceId }));
}

function TraceIndicator({ traceId, count }: { traceId: string; count: number }) {
  const ackByTraceId = useAckByTraceId(traceId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          data-testid="trace-button"
          title={`trace: ${traceId}`}
          className="border"
        >
          ✜ {count}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        onClick={e => {
          e.stopPropagation();
        }}
      >
        <DropdownMenuItem
          data-testid="trace-ack"
          onClick={() => ackByTraceId()}
        >
          ACK by this trace
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={`/by-trace/${traceId}`} data-testid="trace-show">
            Show this trace
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-gray-500 text-center">
          TraceId actions
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
