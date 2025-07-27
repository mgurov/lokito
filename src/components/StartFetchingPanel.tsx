import { START_WHERE_STOPPED, startFetching } from "@/data/fetching/fetchingSlice";
import { useActiveSourceIds } from "@/data/redux/sourcesSlice";
import { SourceLocalStorage } from "@/data/source";
import { PlayIcon } from "@radix-ui/react-icons";
import { subHours, subMinutes } from "date-fns";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const startOptions: Record<string, () => Date> = {
  "now": () => new Date(),
  "last 5 min": () => subMinutes(new Date(), 5),
  "last 1 hour": () => subHours(new Date(), 1),
  "last 6 hours": () => subHours(new Date(), 6),
  "last 24 hours": () => subHours(new Date(), 24),
  // 'day start': 'day start',
  // 'work start 08:00': 'working day start 08:00',
  // 'yesterday work end 16:00': 'working day start 08:00',
  // 'week start': 'week start',
  // 'end prev Friday 16:00': 'end last Friday 16:00'
};

type StartOption = keyof typeof startOptions;

function useEarliestSourceFrom(): string | null {
  const activeSourceIds = useActiveSourceIds();

  let earliestFrom: string | null = null;
  for (const activeSourceId of activeSourceIds) {
    const thisFrom = SourceLocalStorage.lastSuccessFrom.load(activeSourceId);
    if (thisFrom === null) {
      continue;
    }
    if (earliestFrom === null) {
      earliestFrom = thisFrom;
    } else {
      if (thisFrom < earliestFrom) {
        earliestFrom = thisFrom;
      }
    }
  }
  return earliestFrom;
}

export function StartFetchingPanel() {
  const dispatch = useDispatch();
  const showWhenWeStopped = useEarliestSourceFrom();

  function startFetchingSources(option: StartOption) {
    const startFrom = startOptions[option]();
    dispatch(startFetching({ from: startFrom.toISOString() }));
  }

  function startFetchingWhereStopped() {
    dispatch(startFetching({ from: START_WHERE_STOPPED }));
  }

  return (
    <div data-testid="start-fetching-panel" className="mt-2 rounded-md border p-4 text-center">
      <div>
        {showWhenWeStopped && (
          <Button
            className="m-5"
            size="lg"
            variant={"default"}
            data-testid="fetch-option"
            onClick={() => startFetchingWhereStopped()}
            title={showWhenWeStopped}
          >
            since stopped <PlayIcon />
          </Button>
        )}
        {Object.keys(startOptions).map((key) => (
          <Button
            className="m-5"
            size="lg"
            variant={key === "last 1 hour" ? "default" : "secondary"}
            data-testid="fetch-option"
            key={key}
            onClick={() => startFetchingSources(key)}
          >
            {key} <PlayIcon />
          </Button>
        ))}
        <FreeFormStart />
      </div>
    </div>
  );
}

function FreeFormStart() {
  const dispatch = useDispatch();
  const [value, setValue] = useState<string>(new Date().toISOString());
  const [err, setErr] = useState<string>("");

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    const parsed = Date.parse(newValue);
    if (isNaN(parsed)) {
      setErr("Invalid date/time");
    } else {
      setErr("");
    }
  };

  const handleSubmit = () => {
    if (err !== "") {
      return;
    }
    dispatch(startFetching({ from: new Date(value).toISOString() }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="flex w-full max-w-sm items-center gap-2 m-5">
      <Input
        data-testid="arbitrary-date-time-start-input"
        className={["w-52", err === "" ? "" : "border-red-500"].join(" ")}
        value={value}
        onChange={(e) => handleValueChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <Button
        data-testid="arbitrary-date-time-start-button"
        onClick={handleSubmit}
        disabled={err !== ""}
        size="lg"
        type="submit"
        variant="secondary"
      >
        <PlayIcon />
      </Button>
    </div>
  );
}
