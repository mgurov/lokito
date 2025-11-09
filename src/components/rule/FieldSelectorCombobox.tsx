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

export default function FieldSelectorCombobox({ data, field, setField }: {
  data: Record<string, string>;
  field: string | undefined;
  setField: (newValue: string | undefined) => void;
}) {
  const [open, setOpen] = React.useState(false);

  // TODO: stretch all the screen
  // TODO: long values collapse
  // TODO: select back the line.
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          data-testid="select-field-to-match-trigger"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {field
            ? field
            : "Line"}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Line" className="h-9" />
          <CommandList>
            <CommandEmpty>No field found</CommandEmpty>
            <CommandGroup>
              {Object.entries(data).map(([fieldName, fieldValue]) => (
                <CommandItem
                  key={fieldName}
                  value={fieldName}
                  onSelect={(currentValue) => {
                    setField(currentValue);
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
