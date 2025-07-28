import { cn } from "@/lib/utils";
import { CalendarIcon } from "@radix-ui/react-icons";
import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";

export function TTLDatePicker(
  { date, setDate }: { date: Date | undefined; setDate: (date: Date | undefined) => void },
) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          data-testid="auto-ack-ttl-trigger-button"
          variant={"outline"}
          className={cn(
            "w-[15ch] justify-start text-left font-normal",
            !date && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-[0.5ch]" />
          {date ? format(date, "yyyy-MM-dd") : <span>Pick a date</span>}
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
  );
}
