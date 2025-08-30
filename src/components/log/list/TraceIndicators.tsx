import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTraceIdsMultipleMatchesCount } from "@/data/logData/logDataHooks";
import { logDataSliceActions } from "@/data/logData/logDataSlice";
import { LogWithSource } from "@/data/logData/logSchema";
import { useCallback } from "react";
import React from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";

export function TraceIndicators({ row }: { row: LogWithSource }) {
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

  return useCallback(() => dispatch(ackAll({ type: "traceId", traceId })), [traceId, dispatch, ackAll]);
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
