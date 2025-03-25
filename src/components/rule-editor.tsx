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
import { useQuery } from '@tanstack/react-query';
import { Input } from './ui/input';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useAppDispatch } from '@/data/redux/reduxhooks';
import { Filter } from '@/data/filters/filter';
import { createFilter } from '@/data/filters/filtersSlice';
import { randomId } from '@/lib/utils';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import axios from 'axios';

interface NewRuleProps {
  log: Log;
}

export default function NewRule({ log }: NewRuleProps) {
  //TODO: in the future, we might want to allow for field selection, not only the line
  //TODO: ux-wise would be nice to delay while user typing; also do animations to show the alerts
  //TODO: how could we make this all wider?

  const logLine = log.line;

  const dispatch = useAppDispatch();


  function handleSubmit({ save, messageRegex }: SaveRuleProps) {
    const newFilter: Filter = {
      id: randomId(),
      transient: !save,
      messageRegex,
    };
    dispatch(createFilter(newFilter));
  }

  return <RuleDialog logLine={logLine} handleSubmit={handleSubmit} />;
}

type SaveRuleProps = {
  save: boolean;
  messageRegex: string;
}

export function RuleDialog({ logLine, handleSubmit }: { logLine: string, handleSubmit: (p: SaveRuleProps) => void }) {

  const [messageRegex, setMessageRegex] = useState<string>(escapeRegExp(logLine));
  const logLineMatchesRegex = patternMatches(messageRegex, logLine)


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
    <Dialog open onOpenChange={setOpen}>
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
          {typeof(logLineMatchesRegex) === 'object'  && (
            <Alert variant="destructive">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>Can't compile the regular expression</AlertTitle>
              <AlertDescription>{logLineMatchesRegex.errorMessage}</AlertDescription>
            </Alert>
          )}
          <AskTheRobot line={logLine} useSuggestion={setMessageRegex} />
        </div>
        <DialogFooter className="space-x-4">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
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

function AskTheRobot({line, useSuggestion}: {line: string, useSuggestion: (suggestion: string) => void}) {

  const request = useQuery<any>({
    queryKey: ['regex', line],
    retry: false,
    queryFn: () => {
      return axios.post('/ollama/chat', {
        "stream": false,
        "model": "codellama-regex",
        "messages": [
          { "role": "user", "content": line }
        ]
      });
    }
  })

  if (request.isFetching) {
    return <div>
      About to ask robots for an advice...
    </div>    
  }

  if (request.isError) {
    return <div>
      Error {JSON.stringify(request.error, null, 2)}
    </div>
  }

  const suggestion = request.data?.data?.message?.content; 
  //TODO: empty suggestion handling
  //const suggestionMatches = patternMatches(suggestion, line)

  return <><ScrollArea className="rounded bg-muted ">
  <div
    className="relative px-[0.3rem] py-[0.2rem] font-mono text-sm max-h-80"
  >
    <pre>
    {suggestion}
    </pre>
  </div>
  <ScrollBar orientation="horizontal" />
</ScrollArea>
  <Button data-testid="use-suggestion" onClick={() => useSuggestion(suggestion)}>Use suggestion</Button>
</>
}


type PatternTestResult = 'yes' | 'no' | {errorMessage: string}
function patternMatches(pattern: string, line: string): PatternTestResult {
  try {
    return (RegExp(pattern).test(line)) ? 'yes' : 'no'
  } catch (e: unknown) {
    return {errorMessage: (e as { message: string }).message};
  }
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}