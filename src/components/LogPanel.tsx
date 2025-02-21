import { CheckIcon, CopyIcon } from '@radix-ui/react-icons';
import { ReactNode, useState } from 'react';
import NewRule from '@/components/rule-editor';
import { Button } from '@/components/ui/button';

import { Log } from '@/data/schema';
import { useDispatch } from 'react-redux';
import { logDataSliceActions } from '@/data/redux/logDataSlice';
import SimpleTooltip from './SimpleTooltip';

export function LogPanel(props: { log: Log }) {
  const dispatch = useDispatch();
  const {ackTillThis} = logDataSliceActions;
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isNewRuleDialogOpen, setIsNewRuleDialogOpen] = useState(false);

  function handleCopyToClipboard(value: string, field: string) {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
      })
      .catch(console.error);
  }
  const fields = Object.keys(props.log.stream);
  return (
    <>
      <div className="space-y-2">
        <div className="flex w-full">

        <SimpleTooltip content={<><p>All messages up to this event will be ACK'ed.</p><p className="">NB: doesn't respect the source selection, so will ack messages from all sources up to this moment when clicked.</p></>}>
          <Button
                  size="sm"
                  variant="outline"
                  data-testid="ack-till-this"
                  className="ml-1 mt-1"
                  onClick={() => {
                    dispatch(ackTillThis(props.log.id))
                  }}
                >
                  ACK till here
                </Button>

        </SimpleTooltip>         

          <Button
            size="sm"
            variant="outline"
            data-testid="new-rule-button"
            className="ml-1 mt-1"
            onClick={() => {
              setIsNewRuleDialogOpen(true);
            }}
          >
            New Rule
          </Button>
        </div>
        <div className="space-y-1 px-3 py-2">
          <h3 className="text-sm font-semibold">Fields</h3>

          <div className="grid rounded-sm bg-white shadow">
            {fields.map((field) => (
              <div
                key={field}
                className="grid cursor-default grid-cols-[120px_auto_20px] gap-4 px-4 py-2 text-xs"
              >
                <div className="overflow-hidden text-ellipsis" title={field}>
                  {field}
                </div>
                <div className="group flex space-x-2">
                  <span>{props.log.stream?.[field] as ReactNode} </span>
                  {props.log.stream?.[field] !== undefined && (
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleCopyToClipboard(props.log.stream?.[field] as string, field)}
                      className="h-4 w-4 border-none bg-transparent text-gray-600 opacity-0 transition-opacity group-hover:opacity-100"
                      title={copiedField === field ? 'Copied!' : 'Copy'}
                    >
                      {copiedField === field ? <CheckIcon /> : <CopyIcon />}
                      <span className="sr-only">Copy Order ID</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <NewRule log={props.log} open={isNewRuleDialogOpen} setOpen={setIsNewRuleDialogOpen} />
    </>
  );
}
