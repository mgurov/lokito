import { Button } from "@/components/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shadcn/card";
import { TrashIcon } from "@radix-ui/react-icons";
import { useDispatch } from "react-redux";

import { Switch } from "@/components/ui/shadcn/switch";
import { Textarea } from "@/components/ui/shadcn/textarea";
import { changeSourceProperty, deleteSource } from "@/data/redux/sourcesSlice";
import { Source } from "@/data/source";
import { useCallback, useState } from "react";
import { DatasourceSelect } from "./DatasourceSelect";

export function SourceCard({ source }: { source: Source }) {
  const dispatch = useDispatch();
  const [changedValue, setChangedValue] = useState<string>(source.query);

  const handleSaveClick = useCallback(() => {
    const payload = { sourceId: source.id, property: "query" as const, newValue: changedValue };
    dispatch(changeSourceProperty(payload));
  }, [dispatch, source.id, changedValue]);

  return (
    <Card data-testid="source-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <span data-testid="source-name-title">{source.name}</span>
          {changedValue !== source.query && (
            <>
              <div className="flex gap-1">
                <Button
                  data-testid="cancel-query-changes"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setChangedValue(source.query);
                  }}
                  title="Cancel query changes"
                >
                  Cancel
                </Button>

                <Button
                  data-testid="save-query-changes"
                  size="sm"
                  variant="default"
                  onClick={handleSaveClick}
                  title="Update query"
                >
                  OK
                </Button>
              </div>
            </>
          )}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={source.color}
              className="h-8 w-8 cursor-pointer rounded-md border border-input bg-transparent p-[2px] text-sm shadow-sm transition-colors"
              title="Color of the source"
              onChange={(e) =>
                dispatch(
                  changeSourceProperty({ sourceId: source.id, property: "color" as const, newValue: e.target.value }),
                )}
            />
            <Button
              data-testid={`delete-source-${source.id}`}
              size="sm"
              variant="destructive"
              onClick={() => dispatch(deleteSource(source.id))}
              title="Delete source"
            >
              <TrashIcon />
            </Button>
            <Switch
              data-testid={`toggle-active-${source.id}`}
              checked={source.active}
              title="Active/deactivate the source"
              onClick={() =>
                dispatch(
                  changeSourceProperty({ sourceId: source.id, property: "active" as const, newValue: !source.active }),
                )}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-x-scroll p-2">
        <Textarea
          data-testid="source-card-filter-textarea"
          className="width-full height-full font-mono text-sm"
          onChange={(event) => setChangedValue(event.target.value)}
          rows={6}
          defaultValue={source.query}
        />
        <DatasourceSelect
          defaultValue={source.datasource}
          showEmptyOptionOnNoDefaultValue
          onChange={(e) =>
            dispatch(
              changeSourceProperty({ sourceId: source.id, property: "datasource" as const, newValue: e.target.value }),
            )}
        />
      </CardContent>
    </Card>
  );
}
