import { Button } from "@/components/ui/shadcn/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/shadcn/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/shadcn/popover";
import { ChevronsUpDown } from "lucide-react";
import React from "react";

export default function FieldSelectorCombobox({ messageLine, fieldData, field, setField }: {
  messageLine: string;
  fieldData: Record<string, string>;
  field: string | undefined;
  setField: (newValue: string | undefined) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          data-testid="select-field-to-match-trigger"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between"
        >
          {field
            ? field
            : "Message Line"}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" data-testid="field-selector-popup">
        <Command>
          <CommandInput placeholder="Line" className="h-9" data-testid="field-selector-search-input" />
          <CommandList>
            <CommandEmpty>No field found</CommandEmpty>
            <CommandGroup heading="Message Line">
              <CommandItem
                key="message"
                value="message"
                onSelect={() => {
                  setField(undefined);
                  setOpen(false);
                }}
              >
                {messageLine}
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Field">
              {Object.entries(fieldData).map(([fieldName, fieldValue]) => (
                <CommandItem
                  data-testid={"field_selector_option_" + fieldName}
                  key={"field_" + fieldName}
                  onSelect={() => {
                    setField(fieldName);
                    setOpen(false);
                  }}
                >
                  {fieldName} : {fieldValue}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
