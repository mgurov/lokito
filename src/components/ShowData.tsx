import { columns } from "@/components/columns";
import { DataTable } from "@/components/data-table";
import { AckAllOnSourceButton, StatsLine } from "@/components/StatsLine";
import { UploadSourcesConfiguration } from "@/components/upload-config";
import { SourceFetchingState, useOverallFetchingState, useSourcesFetchingState } from "@/data/fetching/fetchingSlice";
import { useData } from "@/data/logData/logDataHooks";
import { LogWithSource } from "@/data/logData/logSchema";
import { useSources } from "@/data/redux/sourcesSlice";
import { Source } from "@/data/source";
import { simpleDateTimeFormat } from "@/lib/utils";
import { ExclamationTriangleIcon, UpdateIcon } from "@radix-ui/react-icons";
import { TabsContent, TabsList } from "@radix-ui/react-tabs";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAckNack } from "./context/AckNackContext";
import { TabsWithSelectedContext } from "./context/SelectedDataTabContext";
import { SelectedSourceContext } from "./context/SelectedSourceContext";
import { NewSource } from "./new-source";
import { SourceCard } from "./source/SourceCard";
import { StartFetchingPanel } from "./StartFetchingPanel";
import { Alert } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { TabsTrigger } from "./ui/tabs";

export function ShowData() {
  const fetchingSourceState = useSourcesFetchingState();
  const sources = useSources();
  const ackNack = useAckNack();
  const data = useData(ackNack === "ack");

  const overallFetchingState = useOverallFetchingState();
  const showDisabledSources = overallFetchingState.from === null;

  const [tabTriggers, tabs] = SourcesTabs({
    dataFromSources: fetchingSourceState,
    data,
    sources,
    disabled: showDisabledSources,
  });

  return (
    <TabsWithSelectedContext>
      <TabsList className="bg-gray-200 rounded-lg border border-gray-300">
        <TabsTrigger data-testid="all-sources-tab" value="all" disabled={showDisabledSources}>
          All&nbsp;{data.length > 0 && <Badge>{data.length}</Badge>}
        </TabsTrigger>
        {tabTriggers}
        <NewSource buttonSize="tab" />
      </TabsList>
      <TabsContent value="all">
        <ShowAllSourcesData data={data} />
      </TabsContent>
      {tabs}
    </TabsWithSelectedContext>
  );
}

function SourcesTabs(
  { dataFromSources, data, sources, disabled }: {
    dataFromSources: { [sourceId: string]: SourceFetchingState };
    data: LogWithSource[];
    sources: Source[];
    disabled: boolean;
  },
) {
  const tabTriggers = [];
  const tabs = [];
  for (const source of sources) {
    const thisSourceUnaccounted = data.filter(log => log.sourcesAndMessages.find(s => s.sourceId === source.id));
    const sourceFetchingState = dataFromSources[source.id];
    if (!source) {
      console.warn("unlikely event when source was empty 🤔"); // potential data inconsistency safety precaution
      continue;
    }
    let tabTextClass = "";
    if (source.active) {
      if (sourceFetchingState?.state === "error") {
        tabTextClass = "animate-pulse";
      }
    } else {
      tabTextClass = "text-neutral-500";
    }
    tabTriggers.push(
      <TabsTrigger key={source.id} value={source.id} data-testid={`source-tab-${source.id}`} disabled={disabled}>
        <div className="flex items-center gap-1">
          <span className={tabTextClass} data-testid="source-name">{source.name}</span>
          {thisSourceUnaccounted.length > 0 && (
            <Badge data-testid="source-unack-count" style={{ backgroundColor: source.color }}>
              {thisSourceUnaccounted.length}
            </Badge>
          )}
          {sourceFetchingState?.state === "fetching" && <UpdateIcon className="animate-spin" />}
          {sourceFetchingState?.state === "error" && (
            <ExclamationTriangleIcon data-testid="source-in-error-indicator" className="animate-pulse text-red-800" />
          )}
        </div>
      </TabsTrigger>,
    );
    tabs.push(
      <TabsContent key={source.id} value={source.id}>
        <SelectedSourceContext.Provider value={{ sourceId: source.id }}>
          <div className="mt-2 space-y-4">
            {sourceFetchingState?.err && <Alert variant="destructive">{sourceFetchingState?.err}</Alert>}
            {!sourceFetchingState?.lastSuccess && <Alert variant="destructive">No fetch has ever succeeded</Alert>}
            {sourceFetchingState?.lastSuccess && (
              <Alert className="text-size-min">
                Last success fetch {simpleDateTimeFormat(sourceFetchingState?.lastSuccess)}
              </Alert>
            )}

            <ShowSourceButton source={source} />

            {thisSourceUnaccounted.length > 0 && (
              <>
                <AckAllOnSourceButton notAckedCount={thisSourceUnaccounted.length} />
                <DataTable data={thisSourceUnaccounted} columns={columns()} />
              </>
            )}
          </div>
        </SelectedSourceContext.Provider>
      </TabsContent>,
    );
  }
  return [tabTriggers, tabs];
}

function ShowSourceButton({ source }: { source: Source }) {
  const [visible, setVisible] = useState(false);
  if (!visible) {
    return <Button data-testid="show-source-button" onClick={() => setVisible(true)}>Show source</Button>;
  }

  return (
    <>
      <Button data-testid="hide-source-button" onClick={() => setVisible(false)}>Hide source</Button>
      <SourceCard source={source} />
    </>
  );
}

function ShowAllSourcesData({ data }: { data: LogWithSource[] }) {
  const overallFetchingState = useOverallFetchingState();
  if (overallFetchingState.from === null) {
    return <StartFetchingPanel />;
  }
  return (
    <div className="mt-2 space-y-4">
      <StatsLine />

      <DataTable data={data} columns={columns()} />
    </div>
  );
}

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
      or upload a configuration from a file <UploadSourcesConfiguration /> to start fetching data.
    </div>
  );
}
