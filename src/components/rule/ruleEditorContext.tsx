import { createContext, useReducer } from "react";
import { RuleEditorSheet } from "./rule-editor";

type RuleEditorState = { open: boolean; logline?: string };

const initialState = { open: false };

export const RuleEditorContext = createContext<RuleEditorState>(initialState);

type RuleEditorActions = {
  open: (logLine: string) => void;
  close: () => void;
};

export const RuleEditorActionContext = createContext<RuleEditorActions | undefined>(undefined);

type RuleEditorAction =
  | { type: "open"; logLine: string }
  | { type: "close" };

function ruleEditorReducer(_current: RuleEditorState, action: RuleEditorAction): RuleEditorState {
  switch (action.type) {
    case "open": {
      return { open: true, logline: action.logLine };
    }
    case "close": {
      return { open: false };
    }
  }
}

export function RuleEditorContextProvider({ children }: { children: React.ReactNode }) {
  const [value, dispatch] = useReducer(
    ruleEditorReducer,
    initialState,
  );

  const actions: RuleEditorActions = {
    open: (logLine: string) => dispatch({ type: "open", logLine }),
    close: () => dispatch({ type: "close" }),
  };

  return (
    <RuleEditorContext.Provider value={value}>
      <RuleEditorActionContext.Provider value={actions}>
        {children}
        <RuleEditorSheet />
      </RuleEditorActionContext.Provider>
    </RuleEditorContext.Provider>
  );
}
