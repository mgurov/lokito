import { CheckIcon, CopyIcon } from '@radix-ui/react-icons';
import { ReactNode, useState, useContext } from 'react';
import NewRule from '@/components/rule-editor';
import { Button } from '@/components/ui/button';

import { Log } from '@/data/logData/logSchema';
import { useDispatch } from 'react-redux';
import { logDataSliceActions } from '@/data/logData/logDataSlice';
import SimpleTooltip from './SimpleTooltip';
import { SelectedSourceContext } from './context/SelectedSourceContext';
import React from 'react';
import { TRACE_ID_FIELDS } from '@/hardcodes';

export function LogPanel(props: { log: Log }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

          <AckTillThisButton messageId={props.log.id} />
          <NewRule logEntry={props.log} />
        </div>
        <div className="space-y-1 px-3 py-2">
          <h3 className="text-sm font-semibold">Fields</h3>

          <div className="grid rounded-sm bg-white shadow">
            <div className="grid cursor-default grid-cols-[auto_1fr] gap-4 px-4 py-2 text-xs">
              {fields.map((field) => (
                <React.Fragment key={field}>
                  <div className={"overflow-hidden text-ellipsis" + (TRACE_ID_FIELDS.includes(field) ? " font-semibold" : "" )} title={field}>
                    {field}
                  </div>
                  <div className="group flex">
                  {props.log.stream?.[field] !== undefined && (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleCopyToClipboard(props.log.stream?.[field] as string, field)}
                        className="h-4 w-0 border-none bg-transparent text-gray-600 opacity-0 transition-opacity group-hover:opacity-100 group-hover:w-4"
                        title={copiedField === field ? 'Copied!' : 'Copy'}
                      >
                        {copiedField === field ? <CheckIcon /> : <CopyIcon />}
                        <span className="sr-only">Copy Order ID</span>
                      </Button>
                    )}
                    <span>{props.log.stream?.[field] as ReactNode} </span>                  
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>      
    </>
  );
}

function AckTillThisButton({ messageId }: { messageId: string }) {
  const selectedSource = useContext(SelectedSourceContext)
  const dispatch = useDispatch();
  const { ackTillThis } = logDataSliceActions;

  return <SimpleTooltip content={<p>All messages up to this event will be ACK'ed.</p>}>
    <Button
      size="sm"
      variant="outline"
      data-testid="ack-till-this"
      className="ml-1 mt-1"
      onClick={() => {
        dispatch(ackTillThis({ messageId, sourceId: selectedSource?.sourceId }))
      }}
    >
      ACK till here
    </Button>

  </SimpleTooltip>
}
