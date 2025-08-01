import { createContext, Dispatch, useReducer } from "react";
import { RuleEditorSheet } from "./rule-editor";

type RuleEditorState = { open: boolean; logline?: string };

const initialState = { open: false };

export const RuleEditorContext = createContext<RuleEditorState>(initialState);

export const RuleEditorDispatchContext = createContext<Dispatch<RuleEditorAction>>(() => {});

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

  return (
    <RuleEditorContext.Provider value={value}>
      <RuleEditorDispatchContext.Provider value={dispatch}>
        {children}
        <RuleEditorSheet />
      </RuleEditorDispatchContext.Provider>
    </RuleEditorContext.Provider>
  );
}
