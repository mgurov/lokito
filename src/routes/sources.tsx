import { TrashIcon } from '@radix-ui/react-icons';
import { useDispatch } from 'react-redux';
import { DownloadSourcesConfiguration } from '@/components/download-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { UploadSourcesConfiguration } from '@/components/upload-config';
import {
  changeSourceActive,
  changeSourceColor,
  deleteSource,
  useSources,
} from '@/data/redux/sourcesSlice';
import { NewSource } from '@/components/new-source';


export default function Index() {
  const dispatch = useDispatch();
  const sources = useSources();
  return (
    <div className="space-y-4">
      <div className="mt-4 flex items-center justify-between">
        <h3 className="text-2xl font-bold tracking-tight">List of sources</h3>
        <div className="flex items-center gap-x-2">
          <NewSource buttonVariant='outline' />
          <UploadSourcesConfiguration />
          <DownloadSourcesConfiguration />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        {sources.map((source) => (
          <Card key={source.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span>{source.name}</span>
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
                    size="sm"
                    variant="destructive"
                    onClick={() => dispatch(deleteSource(source.id))}
                    title="Delete source"
                  >
                    <TrashIcon />
                  </Button>
                  <Switch
                    defaultChecked={source.active}
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
              {/* TODO: Hook update event to onChange? or introduce edit mode to the card? */}
              <Textarea
                className="width-full height-full font-mono text-sm"
                rows={6}
                defaultValue={source.query}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
