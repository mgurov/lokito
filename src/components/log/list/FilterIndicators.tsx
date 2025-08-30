import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logDataSliceActions } from "@/data/logData/logDataSlice";
import { LogWithSource } from "@/data/logData/logSchema";
import React from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";

export function FilterIndicators({ row, hideFilterId }: { row: LogWithSource; hideFilterId: string | undefined }) {
  return Object.entries(row.filters).filter(([id]) => id !== hideFilterId).map(([id]) => (
    <React.Fragment key={id}>
      <FilterIndicator id={id} name={id} />
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
