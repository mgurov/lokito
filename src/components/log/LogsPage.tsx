import { SourceFetchingState, useOverallFetchingState, useSourcesFetchingState } from "@/data/fetching/fetchingSlice";
import { useData } from "@/data/logData/logDataHooks";
import { LogWithSource } from "@/data/logData/logSchema";
import { useSources } from "@/data/redux/sourcesSlice";
import { Source } from "@/data/source";
import { simpleDateTimeFormat } from "@/lib/utils";
import { ExclamationTriangleIcon, UpdateIcon } from "@radix-ui/react-icons";
import { ReactNode, useState } from "react";
import { columns } from "../columns";
import { AckNackProp } from "../context/AckNackContext";
import { SelectedSourceContext } from "../context/SelectedSourceContext";
import { DataTable } from "../data-table";
import { NewSource } from "../new-source";
import { SourceCard } from "../source/SourceCard";
import { StartFetchingPanel } from "../StartFetchingPanel";
import { AckAllOnSourceButton, StatsLine } from "../StatsLine";
import { Alert } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { TabLink } from "../ui/custom/tabs";
import { NoActiveSourcesHint } from "./ShowData";

type LogsPageProps = {
  sourceId: string | undefined;
  ackNack: "ack" | "nack";
};

export default function LogsPage(props: LogsPageProps) {
  return (
    <>
      <NoActiveSourcesHint /> {/** TODO: only on index */}
      <ShowData {...props} />
    </>
  );
}

function ShowData({ ackNack, sourceId }: LogsPageProps) {
  const fetchingSourceState = useSourcesFetchingState();
  const sources = useSources();
  const data = useData(ackNack === "ack");

  const { buttons: sourceButtons, selectedSourceContent } = SourceTabButtonsAndContent({
    dataFromSources: fetchingSourceState,
    data,
    sources,
    selectedSourceId: sourceId,
    ackNack,
  });

  return (
    <>
      <div className="inline-flex h-9 items-center justify-left rounded-lg bg-muted p-1 text-muted-foreground   bg-gray-200 rounded-lg border border-gray-300 ">
        <TabLink to={`/logs${ackNack === "ack" ? "/acked" : ""}`} data-testid="all-sources-tab">all</TabLink>
        {sourceButtons}
        <NewSource buttonSize="tab" />
      </div>
      {sourceId === undefined && <ShowAllSourcesData data={data} ackNack={ackNack} />}
      {selectedSourceContent}
    </>
  );
}
// TODO: expose counts as slice function
function SourceTabButtonsAndContent({ dataFromSources, data, sources, selectedSourceId, ackNack }: {
  dataFromSources: { [sourceId: string]: SourceFetchingState };
  data: LogWithSource[];
  sources: Source[];
  selectedSourceId: string | undefined;
  ackNack: "ack" | "nack";
}) {
  const buttons: Array<ReactNode> = [];

  let selectedSourceContent: ReactNode | null = null;

  for (const source of sources) {
    const thisSourceNaced = data.filter(log => log.sourcesAndMessages.find(s => s.sourceId === source.id));
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
      tabTextClass = "opacity-50";
    }
    buttons.push(
      <TabLink
        key={source.id}
        data-testid={`source-tab-${source.id}`}
        to={`/logs${ackNack === "ack" ? "/acked" : ""}/${source.id}`}
      >
        <div className="flex items-center gap-1">
          <span className={tabTextClass} data-testid="source-name">{source.name}</span>
          {thisSourceNaced.length > 0 && (
            <Badge data-testid="source-unack-count" style={{ backgroundColor: source.color }}>
              {thisSourceNaced.length}
            </Badge>
          )}
          {sourceFetchingState?.state === "fetching" && <UpdateIcon className="animate-spin" />}
          {sourceFetchingState?.state === "error" && (
            <ExclamationTriangleIcon data-testid="source-in-error-indicator" className="animate-pulse text-red-800" />
          )}
        </div>
      </TabLink>,
    );
    if (selectedSourceId === source.id) {
      selectedSourceContent = (
        <div key={"content" + source.id}>
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

              {thisSourceNaced.length > 0 && (
                <>
                  <AckAllOnSourceButton notAckedCount={thisSourceNaced.length} ackNack={ackNack} />
                  <DataTable data={thisSourceNaced} columns={columns()} />
                </>
              )}
            </div>
          </SelectedSourceContext.Provider>
        </div>
      );
    }
  }

  return { buttons, selectedSourceContent };
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

function ShowAllSourcesData({ data, ...rest }: { data: LogWithSource[] } & AckNackProp) {
  const overallFetchingState = useOverallFetchingState();
  if (overallFetchingState.from === null) {
    return <StartFetchingPanel />;
  }
  return (
    <div className="mt-2 space-y-4">
      <StatsLine {...rest} />

      <DataTable data={data} columns={columns()} />
    </div>
  );
}
