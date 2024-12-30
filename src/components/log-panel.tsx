import { CheckIcon, CopyIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import NewRule from '@/components/rule-editor';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { rules } from '@/data/data';
import { Log } from '@/data/schema';

export function LogPanel(props: { log: Log }) {
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
          <Button
            size="sm"
            variant="outline"
            className="rounded-none border-r-0"
            onClick={() => {
              setIsNewRuleDialogOpen(true);
            }}
          >
            New Rule
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="rounded-none border-r-0">
                Add to Rule
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup value={props.log.stream.message}>
                {/* TODO: Should programitically load all rules */}
                {rules.map((rule) => (
                  <DropdownMenuRadioItem key={rule.value} value={rule.value}>
                    {rule.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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
                  <span>{props.log.stream?.[field]} </span>
                  {props.log.stream?.[field] !== undefined && (
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleCopyToClipboard(props.log.stream?.[field], field)}
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
