import { UploadSourcesConfiguration } from "@/components/upload-config";
import { useSources } from "@/data/redux/sourcesSlice";
import { Link } from "react-router-dom";
import { NewSource } from "../new-source";
import { Button } from "../ui/shadcn/button";

// TODO: move somewhere around
export function NoActiveSourcesHint() {
  const sources = useSources();
  const activeSources = sources.filter((source) => source.active);

  if (activeSources.length > 0) return null;

  return (
    <div className="rounded-md bg-blue-50 p-4 text-red-800">
      There are no active sources. You can <NewSource buttonText="create a new one" buttonVariant="outline" />,{" "}
      <Button size="sm" variant="outline" asChild>
        <Link to="/sources">activate an existing one</Link>
      </Button>{" "}
      or upload a configuration from a file <UploadSourcesConfiguration />{" "}
      to start fetching data. Sources are loki queries that are executed every minute to fetch new log messages.
    </div>
  );
}
