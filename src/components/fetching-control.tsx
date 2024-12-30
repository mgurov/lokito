import { useDispatch } from 'react-redux';
import { useState } from 'react';
import { TimerIcon } from '@radix-ui/react-icons';
import { format, subHours, differenceInHours } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import {
  startFetching,
  stopFetching,
  useOverallFetchingState,
} from '@/data/fetching/fetchingSlice';
import { useActiveSources } from '@/data/redux/sourcesSlice';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PopoverClose } from '@radix-ui/react-popover';
import { Link } from 'react-router-dom';

const DEFAULT_HOURS_START_FETCHING_DELAY = 1;
const delayOptions = [
  { hours: 1, label: '1 hour ago' },
  { hours: 6, label: '6 hours ago' },
  { hours: 24, label: '24 hours ago' },
  { hours: 168, label: '7 days ago' },
];

export default function FetchingControl() {
  const dispatch = useDispatch();
  const overallState = useOverallFetchingState();
  const activeSources = useActiveSources();
  const [now, setNow] = useState(new Date());

  function startFetchingSources(delayedHours = DEFAULT_HOURS_START_FETCHING_DELAY) {
    const result = subHours(new Date(), delayedHours);
    dispatch(startFetching({ from: result.toISOString() }));
  }

  function stopFetchingSources() {
    dispatch(stopFetching());
  }

  if (activeSources.length === 0) return null;
  const hoursSinceStartedFetching = differenceInHours(new Date(), overallState.from || new Date());

  return (
    <div className="flex justify-end gap-2">
      <Popover onOpenChange={() => setNow(new Date())}>
        <PopoverTrigger asChild>
          <Button size="sm" variant="secondary" title="Define when to start fetching">
            <TimerIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="flex flex-col gap-y-1 px-2 py-4">
          <div className="px-4 text-center text-sm font-medium">
            {overallState.status === 'active' && overallState.from !== null
              ? `Started fetching at ${format(overallState.from, differenceInHours(new Date(), overallState.from) < 24 ? 'HH:mm' : 'E, dd/MM HH:mm')}`
              : 'Not fetching'}
          </div>
          <div className="grid min-w-[250px] gap-1">
            {delayOptions.map(({ hours, label }) => (
              <PopoverClose key={`${hours}-${label}`} asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    'justify-start font-normal',
                    hoursSinceStartedFetching === hours && 'bg-accent text-accent-foreground',
                  )}
                  onClick={() => {
                    startFetchingSources(hours);
                  }}
                >
                  {label}
                  <span className="ml-auto text-muted-foreground">
                    {format(subHours(now, hours), hours < 24 ? 'HH:mm' : 'E, dd/MM HH:mm')}
                  </span>
                </Button>
              </PopoverClose>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {overallState.status === 'active' ? (
        <Button size="sm" onClick={stopFetchingSources}>
          Stop fetching
        </Button>
      ) : (
        <Button size="sm" onClick={() => startFetchingSources()}>
          Start fetching
        </Button>
      )}

      <Button size="sm" variant="ghost" asChild>
        <Link to="/sources">
          Sources
        </Link>
      </Button>

    </div>
  );
}
