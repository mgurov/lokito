import { Button } from "@/components/ui/shadcn/button";
import { Card, CardContent, CardHeader } from "@/components/ui/shadcn/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/shadcn/tooltip";
import { Filter } from "@/data/filters/filter";
import { changeFilter, deleteFilter, useFilter } from "@/data/filters/filtersSlice";
import { useFilterHitCount, useFilterTotalCount } from "@/data/logData/logDataHooks";
import { TrashIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import Markdown from "react-markdown";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";

export function FilterCardById(props: { filterId: string }) {
  const filter = useFilter(props.filterId);
  return <FilterCard filter={filter} />;
}

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
        {filter.field && <p>Field: {filter.field}</p>}
        <p data-testid="filter-message-regex">{filter.messageRegex}</p>
        <EditableDescription filterId={filter.id} description={filter.description} />
      </CardContent>
    </Card>
  );
}

function EditableDescription({ filterId, description }: { filterId: string; description?: string }) {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(description || "");

  const handleSave = () => {
    dispatch(changeFilter({ id: filterId, type: "description", newValue: value }));
    setIsEditing(false);
  };

  return isEditing
    ? (
      <div className="flex gap-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 px-2 py-1 border rounded resize-y"
          rows={4}
          autoFocus
          data-testid="filter-message-description"
        />
        <Button size="sm" data-testid="filter-message-description-save" onClick={handleSave}>Save</Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setIsEditing(false);
            setValue(description || "");
          }}
        >
          Cancel
        </Button>
      </div>
    )
    : (
      <div className="group flex items-start justify-between">
        <div
          data-testid="filter-message-description"
          className="cursor-pointer text-muted-foreground hover:text-foreground flex-1 pr-2"
        >
          <Markdown>{value || "Add description..."}</Markdown>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(true)}
            data-testid="filter-message-description-edit"
          >
            Edit
          </Button>
        </div>
      </div>
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
