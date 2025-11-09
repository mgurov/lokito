import { createContext, useReducer } from "react";
import { RuleEditorSheet } from "./rule-editor";

type RuleEditorState = { logRecord: undefined | OpenRuleEditorPayload };

const initialState = { logRecord: undefined };

export const RuleEditorContext = createContext<RuleEditorState>(initialState);

type RuleEditorActions = {
  open: (payload: OpenRuleEditorPayload) => void;
  close: () => void;
};

export const RuleEditorActionContext = createContext<RuleEditorActions | undefined>(undefined);

export type OpenRuleEditorPayload = {
  sourceLine: string;
  fieldsData: Record<string, string>;
};

type RuleEditorAction =
  | {
    type: "open";
    payload: OpenRuleEditorPayload;
  }
  | { type: "close" };

function ruleEditorReducer(_current: RuleEditorState, action: RuleEditorAction): RuleEditorState {
  switch (action.type) {
    case "open": {
      return { logRecord: action.payload };
    }
    case "close": {
      return { logRecord: undefined };
    }
  }
}

export function RuleEditorContextProvider({ children }: { children: React.ReactNode }) {
  const [value, dispatch] = useReducer(
    ruleEditorReducer,
    initialState,
  );

  const actions: RuleEditorActions = {
    open: (payload: OpenRuleEditorPayload) => dispatch({ type: "open", payload }),
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
