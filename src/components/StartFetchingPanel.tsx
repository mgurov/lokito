
import { Button } from './ui/button';
import {
  START_WHERE_STOPPED,
  startFetching,
} from '@/data/fetching/fetchingSlice';
import { subHours, subMinutes } from 'date-fns';
import { useDispatch } from 'react-redux';
import { PlayIcon } from "@radix-ui/react-icons"
import { useActiveSourceIds } from '@/data/redux/sourcesSlice';
import { loadSourceLastSuccessFromFromStorage } from '@/data/source';

const startOptions: Record<string, () => Date> = {
  'now': () => new Date(),
  'last 5 min': () => subMinutes(new Date(), 5),
  'last 1 hour': () => subHours(new Date(), 1),
  'last 6 hours': () => subHours(new Date(), 6),
  'last 24 hours': () => subHours(new Date(), 24),
  //'day start': 'day start',
  //'work start 08:00': 'working day start 08:00',
  //'yesterday work end 16:00': 'working day start 08:00',
  //'week start': 'week start',
  //'end prev Friday 16:00': 'end last Friday 16:00'
};

type StartOption = keyof typeof startOptions;

function useEarliestSourceFrom(): string | null {
  const activeSourceIds = useActiveSourceIds();

  let earliestFrom: string | null = null;
  for (const activeSourceId of activeSourceIds) {
    const thisFrom = loadSourceLastSuccessFromFromStorage(activeSourceId)
    if (thisFrom === null) {
      continue;
    }
    if (earliestFrom === null) {
      earliestFrom = thisFrom
    } else {
      if (thisFrom < earliestFrom) {
        earliestFrom = thisFrom
      }
    }
  }
  return earliestFrom;
}


export function StartFetchingPanel() {
  const dispatch = useDispatch();
  const showWhenWeStopped = useEarliestSourceFrom();

  function startFetchingSources(option: StartOption) {
    const startFrom = startOptions[option]();
    dispatch(startFetching({ from: startFrom.toISOString() }));
  }

  function startFetchingWhereStopped() {
    dispatch(startFetching({ from: START_WHERE_STOPPED }));
  }

  return <div data-testid="start-fetching-panel" className="mt-2 rounded-md border p-4 text-center">

    <div>
      {showWhenWeStopped && <Button className='m-5' size="lg" variant={'default'} data-testid="fetch-option" onClick={() => startFetchingWhereStopped()} title={showWhenWeStopped}>since stopped <PlayIcon /> </Button>}
      {
        Object.keys(startOptions).map((key) => (
          <Button className='m-5' size="lg" variant={key === 'last 1 hour' ? 'default' : 'secondary'} data-testid="fetch-option" key={key} onClick={() => startFetchingSources(key)}>{key} <PlayIcon /> </Button>
        ))
      }
    </div>
  </div>
}
