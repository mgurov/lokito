import { Button } from "@/components/ui/shadcn/button";
import { Card, CardContent, CardHeader } from "@/components/ui/shadcn/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/shadcn/tooltip";
import { Filter } from "@/data/filters/filter";
import { deleteFilter } from "@/data/filters/filtersSlice";
import { useFilterHitCount, useFilterTotalCount } from "@/data/logData/logDataHooks";
import { TrashIcon } from "@radix-ui/react-icons";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";

export default function FilterCard({ filter, hideId }: { filter: Filter; hideId?: boolean }) {
  const dispatch = useDispatch();
  return (
    <Card data-testid="filter-card">
      <CardHeader>
        <div className="space-x-4">
          {!hideId && (
            <Link to={`/filter/${filter.id}`}>
              <span className="text-sm text-muted-foreground" data-testid="filter-id">#{filter.id}</span>
            </Link>
          )}
          {filter.autoAck !== false && <span data-testid="auto-ack-sign" className="text-green-400">Auto Ack</span>}
          {filter.captureWholeTrace && (
            <span data-testid="ack-whole-trace" className="text-blue-400">Capture Whole Trace</span>
          )}
          {filter.autoAckTillDate && (
            <span className="text-sm text-muted-foreground" data-testid="autoack-till">
              till {filter.autoAckTillDate}
            </span>
          )}
          <FilterStats filterId={filter.id} />
          <Button
            data-testid="delete-filter-button"
            size="sm"
            variant="destructive"
            onClick={() => dispatch(deleteFilter(filter.id))}
            title="Delete filter"
          >
            <TrashIcon />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p data-testid="filter-message-regex">{filter.messageRegex}</p>
        {filter.description && <p data-testid="filter-message-description">{filter.description}</p>}
      </CardContent>
    </Card>
  );
}

function FilterStats({ filterId }: { filterId: string }) {
  const currentHitCount = useFilterHitCount(filterId);
  const totalHitCount = useFilterTotalCount(filterId);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
          <span data-testid="current-hit-count" className="mr-1">{currentHitCount}</span> /{" "}
          <span data-testid="total-hit-count" className="ml-1">{totalHitCount}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>Hits current session / overall</p>
      </TooltipContent>
    </Tooltip>
  );
}
