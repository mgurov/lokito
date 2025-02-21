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
import { useUnackedData } from '@/data/redux/logDataSlice';
import { Tabs, TabsTrigger } from './ui/tabs';
import { TabsContent, TabsList } from '@radix-ui/react-tabs';
import { ExclamationTriangleIcon, UpdateIcon } from '@radix-ui/react-icons';
import { Alert } from './ui/alert';
import { Log } from '@/data/schema';
import { Badge } from './ui/badge';
import { Source } from '@/data/source';
import { AckAllButton, StatsLine } from '@/components/StatsLine';
import { UploadSourcesConfiguration } from '@/components/upload-config';

export function ShowData() {
  const fetchingSourceState = useSourcesFetchingState();
  const sources = useSources();
  const data = useUnackedData();

  const [tabTriggers, tabs] = SourcesTabs(Object.values(fetchingSourceState), data, sources);
  const doWeHaveData = tabTriggers.length > 0;

  return (
    <Tabs defaultValue="all">
      <TabsList className='bg-gray-200'>
        <TabsTrigger data-testid="all-sources-tab" value="all" disabled={!doWeHaveData}>
          All&nbsp;{data.length > 0 && <Badge>{data.length}</Badge>}
        </TabsTrigger>
        {doWeHaveData
          ? tabTriggers
          : sources
            .filter((source) => source.active)
            .map((source) => (
              <TabsTrigger key={source.id} value={source.id} disabled>
                {source.name}
              </TabsTrigger>
            ))}
        <NewSource />
      </TabsList>
      <TabsContent value="all">
        <ShowAllSourcesData />
      </TabsContent>
      {tabs}
    </Tabs>
  );
}

function SourcesTabs(dataFromSources: SourceFetchingState[], data: Log[], sources: Source[]) {
  const tabTriggers = [];
  const tabs = [];
  for (const source of dataFromSources) {
    const thisSourceUnaccounted = data.filter((log) => log.sourceId === source.sourceId);
    // TODO: Discuss w/ Mykola OR refactor, whatever comes first :)
    const bgColor = sources.find((s) => s.id === source.sourceId)?.color;
    tabTriggers.push(
      <TabsTrigger key={source.sourceId} value={source.sourceId} data-testid={`source-tab-${source.sourceId}`}>
        <div className="flex items-center gap-1">
          <span>{source.sourceName}</span>
          {thisSourceUnaccounted.length > 0 && <Badge data-testid="source-unack-count" style={{ backgroundColor: bgColor }}>{thisSourceUnaccounted.length}</Badge>}
          {source.state === 'fetching' && <UpdateIcon className="animate-spin" />}
          {source.state === 'error' && (
            <span className="px-1">
              <ExclamationTriangleIcon className="size-2 animate-ping text-orange-400" />
            </span>
          )}
        </div>
      </TabsTrigger>,
    );
    tabs.push(
      <TabsContent key={source.sourceId} value={source.sourceId}>
        {/* // TODO: The other wrapper :) */}
        <div className="mt-2 space-y-4">
          {source.err && <Alert variant="destructive">{source.err}</Alert>}
          {!source.lastSuccess && <Alert variant="destructive">No fetch has ever succeeded</Alert>}
          {source.lastSuccess && (
            <Alert className="text-size-min">
              Last success fetch {simpleDateTimeFormat(source.lastSuccess)}
            </Alert>
          )}
          
          {thisSourceUnaccounted.length > 0 && (
            <>
              <AckAllButton notAckedCount={thisSourceUnaccounted.length} sourceId={source.sourceId} />
              <DataTable data={thisSourceUnaccounted} columns={columns} />
            </>
            
          )}
        </div>
        
      </TabsContent>,
    );
  }
  return [tabTriggers, tabs];
}

function ShowAllSourcesData() {
  const overallFetchingState = useOverallFetchingState();
  const data = useUnackedData();
  const sourcesFetchingState = useSourcesFetchingState();

  /**
   * cases: started fetching and waiting; have some non-ack data; have no non-ack data and we're happy
   */

  if (overallFetchingState.firstFetchInProgress) {
    return <div className="rounded-md bg-green-50 p-4">Fetching data...</div>;
  }

  if (Object.values(sourcesFetchingState).filter((source) => source.state === 'error').length > 0) {
    return (
      <div className="rounded-md bg-yellow-50 p-4">
        There are hiccups fetching logs. You probably forgot to run the CLI, check the{' '}
        <a
          href="https://github.com/mgurov/lokito"
          target="_blank"
          rel="noreferrer"
          className="text-blue-400 hover:text-blue-600"
        >
          readme
        </a>{' '}
        on how to run it
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-4">

      <StatsLine />

      <DataTable data={data} columns={columns} />
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
