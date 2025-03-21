import { columns } from '@/components/columns';
import { DataTable } from '@/components/data-table';
import { useSources } from '@/data/redux/sourcesSlice';
import { simpleDateTimeFormat } from '@/lib/utils';
import { NewSource } from './new-source';
import { Link } from '@remix-run/react';
import { Button } from './ui/button';
import {
  SourceFetchingState,
  useOverallFetchingState,
  useSourcesFetchingState,
} from '@/data/fetching/fetchingSlice';
import { useData } from '@/data/redux/logDataSlice';
import { TabsTrigger } from './ui/tabs';
import { TabsContent, TabsList } from '@radix-ui/react-tabs';
import { ExclamationTriangleIcon, UpdateIcon } from '@radix-ui/react-icons';
import { Alert } from './ui/alert';
import { LogWithSource } from '@/data/schema';
import { Badge } from './ui/badge';
import { Source } from '@/data/source';
import { AckAllButton, StatsLine } from '@/components/StatsLine';
import { UploadSourcesConfiguration } from '@/components/upload-config';
import { SelectedSourceContext } from './context/SelectedSourceContext';
import { useAckNack } from './context/AckNackContext';
import { StartFetchingPanel } from './StartFetchingPanel';
import { TabsWithSelectedContext } from './context/SelectedDataTabContext';

export function ShowData() {
  const fetchingSourceState = useSourcesFetchingState();
  const sources = useSources();
  const ackNack = useAckNack();
  const data = useData(ackNack === 'ack');

  const overallFetchingState = useOverallFetchingState();
  const showDisabledSources = overallFetchingState.from === null; 

  const [tabTriggers, tabs] = SourcesTabs({dataFromSources: fetchingSourceState, data, sources, disabled: showDisabledSources});

  return (
    <TabsWithSelectedContext>
      <TabsList className='bg-gray-200 rounded-lg border border-gray-300'>
        <TabsTrigger data-testid="all-sources-tab" value="all" disabled={showDisabledSources}>
          All&nbsp;{data.length > 0 && <Badge>{data.length}</Badge>}
        </TabsTrigger>
        {tabTriggers}
        <NewSource buttonSize='tab' />
      </TabsList>
      <TabsContent value="all">
        <ShowAllSourcesData data={data} />
      </TabsContent>
      {tabs}
    </TabsWithSelectedContext>
  );
}

function SourcesTabs({dataFromSources, data, sources, disabled}: 
  {dataFromSources: { [sourceId: string]: SourceFetchingState }, data: LogWithSource[], sources: Source[], disabled: boolean}
) {
  const tabTriggers = [];
  const tabs = [];
  for (const source of sources) {
    const thisSourceUnaccounted = data.filter((log) => log.sourceId === source.id);
    const sourceFetchingState = dataFromSources[source.id]
    if (!source) {
      continue; // potential data inconsistency safety precaution
    }
    let tabTextClass = "";
    if (source.active) {
      if (sourceFetchingState?.state === 'error') {
        tabTextClass = "animate-pulse"
      }
    } else {
      tabTextClass = 'text-neutral-500'
    }
    tabTriggers.push(
      <TabsTrigger key={source.id} value={source.id} data-testid={`source-tab-${source.id}`} disabled={disabled}>
        <div className="flex items-center gap-1">
          <span className={tabTextClass} data-testid="source-name">{source.name}</span>
          {thisSourceUnaccounted.length > 0 && <Badge data-testid="source-unack-count" style={{ backgroundColor: source.color }}>{thisSourceUnaccounted.length}</Badge>}
          {sourceFetchingState?.state === 'fetching' && <UpdateIcon className="animate-spin" />}
          {sourceFetchingState?.state === 'error' && (
              <ExclamationTriangleIcon data-testid="source-in-error-indicator" className="animate-pulse text-red-800" />
          )}
        </div>
      </TabsTrigger>,
    );
    tabs.push(
      <TabsContent key={source.id} value={source.id}>
        <SelectedSourceContext.Provider value={{sourceId: source.id}}>
          <div className="mt-2 space-y-4">
            {sourceFetchingState?.err && <Alert variant="destructive">{sourceFetchingState?.err}</Alert>}
            {!sourceFetchingState?.lastSuccess && <Alert variant="destructive">No fetch has ever succeeded</Alert>}
            {sourceFetchingState?.lastSuccess && (
              <Alert className="text-size-min">
                Last success fetch {simpleDateTimeFormat(sourceFetchingState?.lastSuccess)}
              </Alert>
            )}

            {thisSourceUnaccounted.length > 0 && (
              <>
                <AckAllButton notAckedCount={thisSourceUnaccounted.length} />
                <DataTable data={thisSourceUnaccounted} columns={columns(false)} />
              </>

            )}
          </div>
        </SelectedSourceContext.Provider>
      </TabsContent>,
    );
  }
  return [tabTriggers, tabs];
}

function ShowAllSourcesData({ data }: { data: LogWithSource[] }) {
  const overallFetchingState = useOverallFetchingState();
  if (overallFetchingState.from === null) {
    return <StartFetchingPanel />;
  }
  return (
    <div className="mt-2 space-y-4">

      <StatsLine />

      <DataTable data={data} columns={columns(true)} />
    </div>
  );
}

export function NoActiveSourcesHint() {
  const sources = useSources();
  const activeSources = sources.filter((source) => source.active);

  if (activeSources.length > 0) return null;

  return (
    <div className="rounded-md bg-blue-50 p-4 text-red-800">
      There are no active sources. You can <NewSource buttonText="create a new one" buttonVariant="outline" />,{' '}
      <Button size="sm" variant="outline" asChild>
        <Link to="/sources">activate an existing one</Link>
      </Button>{' '}
      or upload a configuration from a file <UploadSourcesConfiguration /> to start fetching data.
    </div>
  );
}
