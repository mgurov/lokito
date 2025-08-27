import { DownloadSourcesConfiguration } from "@/components/download-config";
import { Button } from "@/components/ui/button";
import { useDispatch } from "react-redux";

import { NewSource } from "@/components/new-source";
import { SourceCard } from "@/components/source/SourceCard";
import { UploadSourcesConfiguration } from "@/components/upload-config";
import { changeSourceActive, useSources } from "@/data/redux/sourcesSlice";

export default function Index() {
  const dispatch = useDispatch();
  const sources = useSources();

  function activateAllSources() {
    sources.forEach((source) => {
      dispatch(changeSourceActive({ sourceId: source.id, newValue: true }));
    });
  }

  function deactivateAllSources() {
    sources.forEach((source) => {
      dispatch(changeSourceActive({ sourceId: source.id, newValue: false }));
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold tracking-tight">Sources</h3>
        <div className="flex items-center gap-x-2">
          <Button variant="ghost" size="sm" onClick={() => activateAllSources()}>Activate all</Button>
          <Button variant="ghost" size="sm" onClick={() => deactivateAllSources()}>Deactivate all</Button>
          <NewSource buttonVariant="outline" />
          <UploadSourcesConfiguration />
          <DownloadSourcesConfiguration />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        {sources.map((source) => <SourceCard key={source.id} source={source} />)}
      </div>
      {sources.length === 0 && (
        <p>
          Sources are loki queries that are executed every minute to fetch new log messages.
        </p>
      )}
    </div>
  );
}
