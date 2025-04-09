import { TrashIcon } from '@radix-ui/react-icons';
import { useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { changeSourceActive, changeSourceColor, changeSourceQuery, deleteSource } from '@/data/redux/sourcesSlice';
import { Source } from '@/data/source';
import { useCallback, useState } from 'react';

export function SourceCard({source}: {source: Source}) {
    const dispatch = useDispatch();
    const [changedValue, setChangedValue] = useState(source.query);

    const handleSaveClick = useCallback(() => {        
        const payload = { sourceId: source.id, newQueryValue: changedValue };
        dispatch(changeSourceQuery(payload));
      }, [dispatch, source.id, changedValue]);
      
    return (<Card data-testid="source-card">
        <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
                <span data-testid="source-name-title">{source.name}</span> 
                { changedValue !== source.query && <>
                    <div className="flex gap-1">
                        <Button
                                data-testid="cancel-query-changes"
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                    setChangedValue(source.query)
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
                }
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={source.color}
                        className="h-8 w-8 cursor-pointer rounded-md border border-input bg-transparent p-[2px] text-sm shadow-sm transition-colors"
                        title="Color of the source"
                        onChange={(e) =>
                            dispatch(changeSourceColor({ sourceId: source.id, newValue: e.target.value }))
                        }
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
                                changeSourceActive({ sourceId: source.id, newValue: !source.active }),
                            )
                        }
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
        </CardContent>
    </Card>
    )
}