import { createContext } from 'react'

export const SelectedSourceContext = createContext<{sourceId: string} | undefined>(undefined)