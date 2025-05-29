import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Log } from '@/data/logData/logSchema';
import { Button } from './ui/button';
import { CalendarIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import { Input } from './ui/input';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useAppDispatch } from '@/data/redux/reduxhooks';
import { Filter } from '@/data/filters/filter';
import { createFilter } from '@/data/filters/filtersSlice';
import { cn, randomId } from '@/lib/utils';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { useSelectedSourceMessageLine } from './context/SelectedSourceContext';
import { Checkbox } from './ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { Calendar } from './ui/calendar';
import { format } from "date-fns"

export default function NewRule({ logEntry }: { logEntry: Log }) {
  const logLine = useSelectedSourceMessageLine(logEntry)

  const dispatch = useAppDispatch();


  function handleSubmit({ save, messageRegex, autoAck, autoAckTillDate }: SaveRuleProps) {
    const newFilter: Filter = {
      id: randomId(),
      transient: !save,
      messageRegex,
      autoAck,
      autoAckTillDate,
    };
    dispatch(createFilter(newFilter));
  }

  return <RuleDialog logLine={logLine} onSubmit={handleSubmit} />;
}

type SaveRuleProps = {
  save: boolean;
  messageRegex: string;
  autoAck?: boolean;
  autoAckTillDate?: string;
}

export function RuleDialog({ logLine, onSubmit }: { logLine: string, onSubmit: (p: SaveRuleProps) => void }) {

  const [messageRegex, setMessageRegex] = useState<string>(escapeRegExp(logLine));
  let logLineMatchesRegex: 'yes' | 'no' | 'err' = 'no';
  let errorMessage: string | null = null;
  try {
    if (RegExp(messageRegex).test(logLine)) {
      logLineMatchesRegex = 'yes';
    }
  } catch (e: unknown) {
    logLineMatchesRegex = 'err';
    errorMessage = (e as { message: string }).message;
  }
  const [autoAck, setAutoAck] = useState(true);

  const [open, setOpen] = useState(false);

  const [date, setDate] = useState<Date | undefined>(undefined);

  const handleSubmitWithBells = (props: SaveRuleProps) => {
    if (date !== undefined) {
      onSubmit({ ...props, autoAckTillDate: format(date, 'yyyy-MM-dd') });
    } else {
      onSubmit(props);
    }
    setOpen(false);
  }

  if (!open) {
    return <Button
      size="sm"
      variant="outline"
      data-testid="new-rule-button"
      className="ml-1 mt-1"
      onClick={() => {
        setOpen(true);
      }}
    >
      New Rule
    </Button>
      ;
  }

  return (
    <Dialog open onOpenChange={setOpen}>
      <DialogContent className="w-1/2" data-testid="rule-dialog">
        <DialogHeader>
          <DialogTitle>New Rule to rule them all</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <ScrollArea className="rounded bg-muted ">
            <div
              id="line"
              className="relative px-[0.3rem] py-[0.2rem] font-mono text-sm max-h-80"
            >
              <pre>
                {logLine}
              </pre>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <div className="grid grid-cols-4 items-center gap-4">
            <Input
              data-testid="rule_regex"
              id="regex"
              value={messageRegex}
              onChange={(e) => setMessageRegex(e.target.value)}
              className="col-span-4"
            />
          </div>
          {logLineMatchesRegex === 'no' && (
            <Alert>
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>The regular expression doesn't match the line</AlertTitle>
            </Alert>
          )}
          {logLineMatchesRegex === 'err' && (
            <Alert variant="destructive">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>Can't compile the regular expression</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <div className="flex items-center space-x-2">
            <label
              htmlFor="auto-ack"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Autoack
            </label>
            <Checkbox
              id="auto-ack"
              data-testid="auto-ack"
              checked={autoAck}
              onCheckedChange={(checked) => setAutoAck(!!checked)}
            />
            <p className="text-sm text-muted-foreground">
              Uncheck to leave matched messages on the incoming list.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <TTLDatePicker date={date} setDate={setDate} />
            <p className="text-sm text-muted-foreground">
              stop auto-ack'ing after this date (inclusive, UTC)
            </p>
          </div>

        </div>
        <DialogFooter className="space-x-4">
          <DialogClose asChild>
            <Button data-testid="close-rule-button" type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
          <Button data-testid="apply-rule-button" disabled={logLineMatchesRegex != 'yes'} onClick={() => onSubmit({ save: false, messageRegex, autoAck })} type="submit" variant="secondary">
            Apply on current
          </Button>
          <Button data-testid="save-rule-button" disabled={logLineMatchesRegex != 'yes'} onClick={() => handleSubmitWithBells({ save: true, messageRegex, autoAck })} type="submit">
            Save for the future
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TTLDatePicker({ date, setDate }: { date: Date | undefined, setDate: (date: Date | undefined) => void }) {

  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          data-testid="auto-ack-ttl-trigger-button"
          variant={"outline"}
          className={cn(
            "w-[15ch] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className='mr-[0.5ch]' />
          {date ? format(date, 'yyyy-MM-dd') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={d => {
            setDate(d);
            setOpen(false);
          }}
          autoFocus
          disabled={{ before: new Date() }}
          className="rounded-md border bg-white"
        />
      </PopoverContent>
    </Popover>
  )
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
