import { Filter } from "@/data/filters/filter";
import { createFilter } from "@/data/filters/filtersSlice";
import { useAppDispatch } from "@/data/redux/reduxhooks";
import { cn, randomId } from "@/lib/utils";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { Dispatch, SetStateAction, useContext, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "../ui/shadcn/alert";
import { Button, ButtonProps } from "../ui/shadcn/button";
import { Checkbox } from "../ui/shadcn/checkbox";
import { Input } from "../ui/shadcn/input";
import { ScrollArea, ScrollBar } from "../ui/shadcn/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/shadcn/sheet";
import { escapeRegExp } from "./regex-utils";
import { OpenRuleEditorPayload, RuleEditorActionContext, RuleEditorContext } from "./ruleEditorContext";
import { TTLDatePicker } from "./TTLDatePicker";

import { FilterOnField, useMatchedAckedUnackedCount } from "@/data/logData/logDataHooks";
import { GoogleIcon } from "../ui/icons/GoogleIcon";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/shadcn/card";
import { Switch } from "../ui/shadcn/switch";
import { Textarea } from "../ui/shadcn/textarea";
import FieldSelectorCombobox from "./FieldSelectorCombobox";

export function RuleEditorSheet() {
  const ruleEditorDispatch = useContext(RuleEditorActionContext);
  const { logRecord } = useContext(RuleEditorContext);

  const appDispatch = useAppDispatch();

  function handleSubmit(p: SaveRuleProps) {
    if (p !== "cancel") {
      const { save, messageRegex, extra, captureWholeTrace, field } = p;
      const newFilter: Filter = {
        id: randomId(),
        transient: !save,
        messageRegex,
        field,
        captureWholeTrace,
        ...(extra || {}),
      };
      appDispatch(createFilter(newFilter));
    }
    if (ruleEditorDispatch) {
      ruleEditorDispatch.close();
    }
  }

  if (!ruleEditorDispatch) {
    console.error("Internal error: no expected dispatch");
    return <Alert>Internal error: no expected dispatch</Alert>;
  }

  return (
    <>
      <Sheet
        open={!!logRecord}
        onOpenChange={(open) => {
          if (!open) {
            ruleEditorDispatch.close();
          }
        }}
      >
        <SheetContent side="bottom" className="min-h-full">
          <SheetHeader>
            <SheetTitle>
              <div className="flex">
                <GoogleIcon icon="filter-alt" />
                <span>Filter</span>
              </div>
            </SheetTitle>
            <SheetDescription>
              Make the regex to match the desigred lines and either apply once to the current logs or save for applying
              to all the future logs.
            </SheetDescription>
          </SheetHeader>
          {logRecord
            && (
              <RuleEditSection
                logRecord={logRecord}
                onSubmit={handleSubmit}
              />
            )}
        </SheetContent>
      </Sheet>
    </>
  );
}

export type SaveRuleProps =
  | "cancel"
  | Step1PersistAction & Step1FilterProps & {
    extra: Step2FilterProps | undefined;
  };

export type Step1PersistAction = {
  save: boolean;
};

export type Step1FilterProps = {
  messageRegex: string;
  captureWholeTrace: boolean;
  field: string | undefined; // undefined for the current source line message
};

export type Step2FilterProps = {
  autoAck: boolean;
  autoAckTillDate: string | undefined;
  description: string | undefined;
};

export function RuleEditSection(
  { logRecord, onSubmit }: { logRecord: OpenRuleEditorPayload; onSubmit: (p: SaveRuleProps) => void },
) {
  const [step, setStep] = useState<"filter" | "persistence">("filter");
  const step1State = useState<Step1FilterProps>({
    messageRegex: escapeRegExp(logRecord.sourceLine),
    captureWholeTrace: true,
    field: undefined,
  });

  const onStep1Submit = (
    step1: Step1PersistAction | "cancel",
  ) => {
    if (step1 === "cancel") {
      onSubmit("cancel");
      return;
    }
    if (!step1.save) {
      onSubmit({ ...step1, ...step1State[0], extra: undefined });
    } else {
      setStep("persistence");
    }
  };

  const onStep2Submit = (
    step2: Step2FilterProps | "cancel",
  ) => {
    if (step2 === "cancel") {
      onSubmit("cancel");
      return;
    }
    onSubmit({ save: true, ...step1State[0], extra: step2 });
  };

  return (
    <div data-testid="rule-edit-section">
      {step === "filter" && (
        <RuleFilterStep
          logRecord={logRecord}
          step1State={step1State}
          onSubmit={onStep1Submit}
        />
      )}
      {step === "persistence" && (
        <RulePersistenceStep
          step1Props={step1State[0]}
          onSubmit={onStep2Submit}
          backToFilterStep={() => setStep("filter")}
        />
      )}
    </div>
  );
}

function RuleFilterStep(
  { step1State, logRecord, onSubmit }: {
    step1State: [Step1FilterProps, Dispatch<SetStateAction<Step1FilterProps>>];
    logRecord: OpenRuleEditorPayload;
    onSubmit: (p: Step1PersistAction | "cancel") => void;
  },
) {
  const [step1Props, setStep1Props] = step1State;
  const valueToMatch = step1Props.field ? logRecord.fieldsData[step1Props.field] : logRecord.sourceLine;
  let logLineMatchesRegex: "yes" | "no" | "err" = "no";
  let errorMessage: string | null = null;
  try {
    if (RegExp(step1Props.messageRegex).test(valueToMatch)) {
      logLineMatchesRegex = "yes";
    }
  } catch (e: unknown) {
    logLineMatchesRegex = "err";
    errorMessage = (e as { message: string }).message;
  }

  return (
    <>
      <div className="flex flex-col gap-4 py-4">
        <div className="flex items-center space-x-2">
          <label
            htmlFor="field"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Field:
          </label>

          <FieldSelectorCombobox
            data={logRecord.fieldsData}
            field={step1Props.field}
            setField={(newValue) => setStep1Props(current => ({ ...current, field: newValue }))}
          />
        </div>

        <ScrollArea className="rounded">
          <div
            id="line"
            className="relative px-[0.3rem] py-[0.2rem] font-mono text-sm max-h-80"
          >
            <pre>
              {valueToMatch}
            </pre>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <Input
          data-testid="rule_regex"
          id="regex"
          value={step1Props.messageRegex}
          onChange={(e) => setStep1Props(current => ({ ...current, messageRegex: e.target.value }))}
          className={cn(
            logLineMatchesRegex === "no" && "border-amber-700/50 focus-visible:ring-amber-700/50",
            logLineMatchesRegex === "err" && "border-destructive/50 focus-visible:ring-destructive/50",
          )}
        />

        {logLineMatchesRegex === "no" && (
          <Alert variant="warn">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertTitle>Not a match</AlertTitle>
            <AlertDescription>The regular expression doesn't match the line</AlertDescription>
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
            Capture the whole trace
          </label>
          <Checkbox
            id="ack-trace"
            data-testid="ack-trace"
            checked={step1Props.captureWholeTrace}
            onCheckedChange={(checked) => setStep1Props(current => ({ ...current, captureWholeTrace: !!checked }))}
          />
          <p className="text-sm text-muted-foreground">
            Acks all messages with the same trace IDs as the matched one
          </p>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:space-x-2">
        <MatchNowButton
          regex={step1Props.messageRegex}
          field={step1Props.field}
          data-testid="apply-rule-button"
          onClick={() => onSubmit({ save: false })}
          variant="secondary"
        />
        <Button
          data-testid="persist-rule-button"
          disabled={logLineMatchesRegex != "yes"}
          onClick={() => onSubmit({ save: true })}
        >
          Match from now on and for ever...
        </Button>
        <Button
          data-testid="close-rule-button"
          onClick={() => onSubmit("cancel")}
          variant="secondary"
        >
          Never mind
        </Button>
      </div>
    </>
  );
}

function MatchNowButton({ regex, field, ...theRest }: ButtonProps & FilterOnField) {
  const [matchedUnackedCount, matchedAckedCount, totalCount] = useMatchedAckedUnackedCount({ regex, field }).split("|")
    .map(
      s => parseInt(s, 10),
    );

  let buttonText = "Nothing matched";
  if (totalCount > 0) {
    buttonText = `Ack ${matchedUnackedCount} matched now`;
    if (matchedAckedCount > 0) {
      buttonText += ` (of ${totalCount})`;
    }
  }

  return (
    <Button
      disabled={totalCount === 0}
      {...theRest}
    >
      {buttonText}
    </Button>
  );
}

function RulePersistenceStep(
  { step1Props, onSubmit, backToFilterStep }: {
    step1Props: Step1FilterProps;
    onSubmit: (p: Step2FilterProps | "cancel") => void;
    backToFilterStep: () => void;
  },
) {
  const [autoAck, setAutoAck] = useState(true);

  const [date, setDate] = useState<Date | undefined>(undefined);

  const [description, setDescription] = useState<string | undefined>(undefined);

  const handleSubmit = () => {
    const autoAckTillDate = date !== undefined ? format(date, "yyyy-MM-dd") : undefined;
    onSubmit({
      autoAckTillDate,
      autoAck,
      description,
    });
  };

  return (
    <>
      <div className="flex flex-col gap-4 py-4">
        <Input
          data-testid="rule_regex"
          id="regex"
          disabled
          value={step1Props.messageRegex}
        />

        <Card>
          <CardHeader>
            <CardTitle>
              <Switch
                id="auto-ack"
                data-testid="auto-ack"
                checked={autoAck}
                onCheckedChange={(checked) => setAutoAck(!!checked)}
              />{" "}
              <label
                htmlFor="auto-ack"
                className="leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Autoack
              </label>
            </CardTitle>
            <CardDescription>Remove matched messages from the "needs attention" list</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <TTLDatePicker date={date} setDate={setDate} enabled={autoAck} />
              <p className="text-sm text-muted-foreground">
                stop auto-ack'ing after this date (inclusive, UTC). E.g. if expected to be fixed, or more time to
                address this non-critical case.
              </p>
            </div>
          </CardContent>
        </Card>

        <Textarea
          data-testid="filter-description-input"
          placeholder="More details about the filter"
          value={description || ""}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex flex-col-reverse sm:flex-row sm:space-x-2">
          <Button
            data-testid="back-to-filter-button"
            onClick={backToFilterStep}
            variant="secondary"
          >
            Back to regex...
          </Button>
          <Button
            data-testid="save-rule-button"
            onClick={() => handleSubmit()}
          >
            Save
          </Button>
          <Button
            data-testid="close-rule-button"
            onClick={() => onSubmit("cancel")}
            variant="secondary"
          >
            Never mind
          </Button>
        </div>
      </div>
    </>
  );
}
