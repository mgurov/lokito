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
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useCallback, useState } from 'react';
import { Input } from './ui/input';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Filter } from '@/data/filters/filter';
import { createFilter } from '@/data/filters/filtersSlice';
import { randomId } from '@/lib/utils';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { useSelectedSourceMessageLine } from './context/SelectedSourceContext';
import { useDispatch } from 'react-redux';

export function useNewRuleHandleSubmissionDispatched() {
  const dispatch = useDispatch();

  function handleSubmit({ save, messageRegex }: SaveRuleProps) {
    const newFilter: Filter = {
      id: randomId(),
      transient: !save,
      messageRegex,
    };
    dispatch(createFilter(newFilter));
  }

  return useCallback(handleSubmit, [dispatch])
}

export default function NewRule({ logEntry }: {logEntry: Log}) {

  const handleSubmit = useNewRuleHandleSubmissionDispatched()

  const logLine = useSelectedSourceMessageLine(logEntry)  


  return <RuleDialogButton logLine={logLine} handleSubmit={handleSubmit} />;
}

export function NewRuleFromSelectionDialog({ logLine, preselectedText, open, setOpen }: 
    {logLine: string, preselectedText? : string, open: boolean, setOpen: (b: boolean) => void}) {

  const handleSubmit = useNewRuleHandleSubmissionDispatched()

  return <RuleDialog logLine={logLine} suggestedLine={preselectedText} handleSubmit={handleSubmit} open={open} setOpen={setOpen} />;
}

type SaveRuleProps = {
  save: boolean;
  messageRegex: string;
}

export function RuleDialogButton({ logLine, handleSubmit }: { logLine: string, handleSubmit: (p: SaveRuleProps) => void }) {

  const [open, setOpen] = useState(false);
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
    <RuleDialog logLine={logLine} suggestedLine={undefined} handleSubmit={handleSubmit} open={open} setOpen={setOpen} />
  );
}

export function RuleDialog({ logLine, suggestedLine, handleSubmit, open, setOpen }: 
  { logLine: string, suggestedLine: string | undefined, handleSubmit: (p: SaveRuleProps) => void, open: boolean, setOpen: (b: boolean) => void }) {

  const [messageRegex, setMessageRegex] = useState<string>(escapeRegExp(suggestedLine ?? logLine));

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-1/2">
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
              <pre data-testid="original-line">
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
        </div>
        <DialogFooter className="space-x-4">
          <DialogClose asChild>
            <Button data-testid="close-rule-button" type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
          <Button data-testid="apply-rule-button" disabled={logLineMatchesRegex != 'yes'} onClick={() => handleSubmit({ save: false, messageRegex })} type="submit">
            Apply on current
          </Button>
          <Button data-testid="save-rule-button" disabled={logLineMatchesRegex != 'yes'} onClick={() => handleSubmit({ save: true, messageRegex })} type="submit">
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
