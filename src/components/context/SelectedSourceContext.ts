import { Log } from "@/data/logData/logSchema";
import { createContext, useContext } from "react";

export const SelectedSourceContext = createContext<{ sourceId: string } | undefined>(undefined);

export function useSelectedSourceMessageLine(logEntry: Log): string {
  const selectedSource = useContext(SelectedSourceContext);

  const selectedSourceRecord = logEntry.sourcesAndMessages.find(s => s.sourceId === selectedSource?.sourceId);

  return selectedSourceRecord?.message ?? logEntry.sourcesAndMessages[0].message;
}
