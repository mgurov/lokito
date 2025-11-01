import { FilterCardById } from "@/components/rule/FilterCard";
import SimpleTooltip from "@/components/ui/custom/SimpleTooltip";
import { GoogleIcon } from "@/components/ui/icons/GoogleIcon";
import { Button } from "@/components/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";
import { logDataSliceActions } from "@/data/logData/logDataSlice";
import { LogWithSource } from "@/data/logData/logSchema";
import React from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";

export function FilterIndicators({ row, hideFilterId }: { row: LogWithSource; hideFilterId: string | undefined }) {
  return Object.entries(row.filters).filter(([id]) => id !== hideFilterId).map(([id]) => (
    <React.Fragment key={id}>
      <FilterIndicator id={id} />
    </React.Fragment>
  ));
}

function FilterIndicator({ id }: { id: string }) {
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
          <SimpleTooltip content={<FilterCardById filterId={id} />}>
            <GoogleIcon icon="filter-alt" />
          </SimpleTooltip>
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
          <FilterCardById filterId={id} />
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
