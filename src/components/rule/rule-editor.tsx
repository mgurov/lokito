import { Filter } from "@/data/filters/filter";
import { createFilter } from "@/data/filters/filtersSlice";
import { useAppDispatch } from "@/data/redux/reduxhooks";
import { randomId } from "@/lib/utils";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { useContext, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet";
import { escapeRegExp } from "./regex-utils";
import { RuleEditorContext, RuleEditorDispatchContext } from "./ruleEditorContext";
import { TTLDatePicker } from "./TTLDatePicker";

export function RuleEditorSheet() {
  const ruleEditorDispatch = useContext(RuleEditorDispatchContext);
  const { open, logline } = useContext(RuleEditorContext);

  const appDispatch = useAppDispatch();

  function handleSubmit(p: SaveRuleProps | undefined) {
    if (p !== undefined) {
      const { save, messageRegex, autoAck, autoAckTillDate, description, captureWholeTrace } = p;
      const newFilter: Filter = {
        id: randomId(),
        transient: !save,
        messageRegex,
        autoAck,
        autoAckTillDate,
        description,
        captureWholeTrace,
      };
      appDispatch(createFilter(newFilter));
    }
    ruleEditorDispatch({ type: "close" });
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(open) => {
          if (!open) {
            ruleEditorDispatch({
              type: "close",
            });
          }
        }}
      >
        <SheetContent side="bottom" className="min-h-full">
          <SheetHeader>
            <SheetTitle>New Rule</SheetTitle>
            <SheetDescription>
              Make the regex match the desigred lines and either apply once to the current logs or save for applying to
              all the future logs.
            </SheetDescription>
          </SheetHeader>
          <RuleEditSection
            logLine={logline || "Should not happpen"}
            onSubmit={handleSubmit}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

export type SaveRuleProps = {
  save: boolean;
  messageRegex: string;
  autoAck?: boolean;
  autoAckTillDate?: string;
  description?: string;
  captureWholeTrace: boolean;
};

export function RuleEditSection(
  { logLine, onSubmit }: { logLine: string; onSubmit: (p: SaveRuleProps | undefined) => void },
) {
  const [step, setStep] = useState<"filter" | "persistence">("filter");
  const [messageRegex, setMessageRegex] = useState<string>("");
  const [captureWholeTrace, setCaptureWholeTrace] = useState(true);

  // TODO: subtype
  const showPersistenceStep = ({ messageRegex }: { messageRegex: string; captureWholeTrace: boolean }) => {
    setMessageRegex(messageRegex);
    setCaptureWholeTrace(captureWholeTrace);
    setStep("persistence");
  };

  return (
    <div data-testid="rule-edit-section">
      {step === "filter" && (
        <RuleFilterStep
          logLine={logLine}
          onSubmit={onSubmit}
          showPersistenceStep={showPersistenceStep}
        />
      )}
      {step === "persistence" && (
        <RulePersistenceStep
          messageRegex={messageRegex}
          captureWholeTrace={captureWholeTrace}
          onSubmit={onSubmit}
          backToFilterStep={() => setStep("filter")}
        />
      )}
    </div>
  );
}

function RuleFilterStep(
  { logLine, onSubmit, showPersistenceStep }: {
    logLine: string;
    onSubmit: (p: SaveRuleProps | undefined) => void;
    showPersistenceStep: (props: { messageRegex: string; captureWholeTrace: boolean }) => void;
  },
) {
  const [captureWholeTrace, setCaptureWholeTrace] = useState(true);
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

  return (
    <>
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
            htmlFor="ack-trace"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Ack by trace
          </label>
          <Checkbox
            id="ack-trace"
            data-testid="auto-ack"
            checked={captureWholeTrace}
            onCheckedChange={(checked) => setCaptureWholeTrace(!!checked)}
          />
          <p className="text-sm text-muted-foreground">
            Acks all messages with the same trace IDs as the matched one
          </p>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
        <Button
          data-testid="apply-rule-button"
          disabled={logLineMatchesRegex != "yes"}
          onClick={() => onSubmit({ save: false, messageRegex, captureWholeTrace })}
          variant="secondary"
        >
          Apply on current
        </Button>
        <Button
          data-testid="persist-rule-button"
          disabled={logLineMatchesRegex != "yes"}
          onClick={() => showPersistenceStep({ messageRegex, captureWholeTrace })}
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
    </>
  );
}

function RulePersistenceStep(
  { messageRegex, onSubmit, backToFilterStep, captureWholeTrace }: {
    messageRegex: string;
    captureWholeTrace: boolean;
    onSubmit: (p: SaveRuleProps | undefined) => void;
    backToFilterStep: () => void;
  },
) {
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

  // TODO: no point allowing autoack-stop-date if non-acking.

  return (
    <>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Input
            data-testid="rule_regex"
            id="regex"
            disabled
            value={messageRegex}
            className="col-span-4"
          />
        </div>

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

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
        <Button
          data-testid="back-to-filter-button"
          onClick={backToFilterStep}
          variant="secondary"
        >
          Back to filter
        </Button>
        <Button
          data-testid="save-rule-button"
          onClick={() => handleSubmitWithBells({ save: true, messageRegex, autoAck, description, captureWholeTrace })}
        >
          Save
        </Button>
        <Button
          data-testid="close-rule-button"
          onClick={() => onSubmit(undefined)}
          variant="secondary"
        >
          Never mind
        </Button>
      </div>
    </>
  );
}
