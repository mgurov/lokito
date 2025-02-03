import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Log } from '@/data/schema';
import { Button } from './ui/button';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import { Input } from './ui/input';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useAppDispatch } from '@/data/redux/reduxhooks';
import { Filter } from '@/data/filters/filter';
import { createFilter } from '@/data/filters/filtersSlice';
import { randomId } from '@/lib/utils';
import { ScrollArea, ScrollBar } from './ui/scroll-area';

interface NewRuleProps {
  log: Log;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function NewRule({ log, open, setOpen }: NewRuleProps) {
  //TODO: in the future, we might want to allow for field selection, not only the line
  //TODO: ux-wise would be nice to delay while user typing; also do animations to show the alerts
  //TODO: how could we make this all wider?

  const logLine = log.line;

  const [messageRegex, setMessageRegex] = useState<string>(escapeRegExp(logLine));

  const dispatch = useAppDispatch();

  if (!open) {
    return null;
  }

  let logLineMatchesRegex: 'yes' | 'no' | 'err' = 'no';
  let errorMessage: string | null = null;
  try {
    if (RegExp(messageRegex).test(logLine)) {
      logLineMatchesRegex = 'yes';
    }
  } catch (e: unknown) {
    logLineMatchesRegex = 'err';
    errorMessage = (e as {message: string}).message;
  }

  function handleSubmit({save}: {save: boolean}){ 
    return (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    const newFilter: Filter = {
      id: randomId(),
      transient: !save,
      messageRegex,
    };
    dispatch(createFilter(newFilter));
  };
}

  return (
    <Dialog open onOpenChange={setOpen}>
      <DialogContent className="w-1/2">
        <DialogHeader>
          <DialogTitle>New Rule to rule them all</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <ScrollArea className="rounded bg-muted ">
            <code
              id="line"
              className="relative px-[0.3rem] py-[0.2rem] font-mono text-sm"
            >
              {logLine}
            </code>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <div className="grid grid-cols-4 items-center gap-4">
            <Input
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
        </div>
        <DialogFooter className="space-x-4">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
          <Button data-testid="apply-rule-button" disabled={logLineMatchesRegex != 'yes'} onClick={handleSubmit({save: false})} type="submit">
            Apply on current
          </Button>
          <Button data-testid="save-rule-button" disabled={logLineMatchesRegex != 'yes'} onClick={handleSubmit({save: true})} type="submit">
            Save for the future
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
