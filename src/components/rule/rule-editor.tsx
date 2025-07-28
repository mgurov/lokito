import { Filter } from "@/data/filters/filter";
import { createFilter } from "@/data/filters/filtersSlice";
import { useAppDispatch } from "@/data/redux/reduxhooks";
import { randomId } from "@/lib/utils";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button, ButtonProps } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { escapeRegExp } from "./regex-utils";
import { TTLDatePicker } from "./TTLDatePicker";

export function useRuleEditor() {
  const [showCreateNewFilter, setShowCreateNewFilter] = useState<boolean>(false);

  const dispatch = useAppDispatch();

  function handleSubmit(p: SaveRuleProps | undefined) {
    if (p !== undefined) {
      const { save, messageRegex, autoAck, autoAckTillDate, description } = p;
      const newFilter: Filter = {
        id: randomId(),
        transient: !save,
        messageRegex,
        autoAck,
        autoAckTillDate,
        description,
      };
      dispatch(createFilter(newFilter));
    }
    setShowCreateNewFilter(false);
  }

  const toggleShowCreateNewFilter = () => setShowCreateNewFilter(v => !v);

  const EditorToggleButton = ({ onClick, ...props }: ButtonProps) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      toggleShowCreateNewFilter();
      if (onClick) {
        onClick(event);
      }
    };
    return <Button onClick={handleClick} {...props} />;
  };

  return {
    showCreateNewFilter,
    RuleEditor: (props: { logLine: string }) => <RuleEditSection {...props} onSubmit={handleSubmit} />,
    EditorToggleButton,
  };
}

export type SaveRuleProps = {
  save: boolean;
  messageRegex: string;
  autoAck?: boolean;
  autoAckTillDate?: string;
  description?: string;
};

export function RuleEditSection(
  { logLine, onSubmit }: { logLine: string; onSubmit: (p: SaveRuleProps | undefined) => void },
) {
  const [messageRegex, setMessageRegex] = useState<string>(escapeRegExp(logLine));
  let logLineMatchesRegex: "yes" | "no" | "err" = "no";
  let errorMessage: string | null = null;
  try {
    if (RegExp(messageRegex).test(logLine)) {
      logLineMatchesRegex = "yes";
    }
  } catch (e: unknown) {
    logLineMatchesRegex = "err";
    errorMessage = (e as { message: string }).message;
  }
  const [autoAck, setAutoAck] = useState(true);

  const [date, setDate] = useState<Date | undefined>(undefined);

  const [description, setDescription] = useState<string | undefined>(undefined);

  const handleSubmitWithBells = (props: SaveRuleProps) => {
    if (date !== undefined) {
      onSubmit({ ...props, autoAckTillDate: format(date, "yyyy-MM-dd") });
    } else {
      onSubmit(props);
    }
  };

  return (
    <div className="px-3 pb-2" data-testid="rule-edit-section">
      <div className="grid gap-4 py-4">
        <ScrollArea className="rounded">
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
        {logLineMatchesRegex === "no" && (
          <Alert>
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertTitle>The regular expression doesn't match the line</AlertTitle>
          </Alert>
        )}
        {logLineMatchesRegex === "err" && (
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

        <div className="grid grid-cols-4 items-center gap-4">
          <Input
            data-testid="filter-description-input"
            className="col-span-4"
            placeholder="details"
            value={description || ""}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2">
          <TTLDatePicker date={date} setDate={setDate} />
          <p className="text-sm text-muted-foreground">
            stop auto-ack'ing after this date (inclusive, UTC)
          </p>
        </div>
      </div>

      <div className="flex space-x-2">
        <Button
          data-testid="apply-rule-button"
          disabled={logLineMatchesRegex != "yes"}
          onClick={() => onSubmit({ save: false, messageRegex, autoAck, description })}
          variant="secondary"
        >
          Apply on current
        </Button>
        <Button
          data-testid="save-rule-button"
          disabled={logLineMatchesRegex != "yes"}
          onClick={() => handleSubmitWithBells({ save: true, messageRegex, autoAck, description })}
        >
          Save for the future
        </Button>
        <Button
          data-testid="close-rule-button"
          onClick={() => onSubmit(undefined)}
          variant="secondary"
        >
          Never mind
        </Button>
      </div>
    </div>
  );
}
