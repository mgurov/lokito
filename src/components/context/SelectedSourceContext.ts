import { Log } from '@/data/schema'
import { createContext, useContext } from 'react'

export const SelectedSourceContext = createContext<{sourceId: string} | undefined>(undefined)


export function useSelectedSourceMessageLine(logEntry: Log): string {
  const selectedSource = useContext(SelectedSourceContext)
  
  if (selectedSource === undefined) {
    return logEntry.line
  }

  return logEntry.sourcesAndMessages.find(s => s.sourceId === selectedSource.sourceId)?.message || logEntry.line

}
