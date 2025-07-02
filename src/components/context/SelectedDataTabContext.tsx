import { createContext, Dispatch, useContext, useReducer } from "react";
import { Tabs } from "../ui/tabs";

type SelectedTab = string; // TODO: diff with the source ones

const SelectedDataTabContext = createContext<SelectedTab>("all");

const SelectedDataTabDispatchContext = createContext<Dispatch<SelectedTabAction>>(() => {});

type SelectedTabAction = { type: "selectTab"; payload: SelectedTab };

function selectedTabReducer(_current: SelectedTab, action: SelectedTabAction): SelectedTab {
  switch (action.type) {
    case "selectTab": {
      return action.payload;
    }
  }
}

export function useSelectedTab() {
  const context = useContext(SelectedDataTabContext);
  return context;
}

export function useSelectTab() {
  const dispatch = useContext(SelectedDataTabDispatchContext);
  return (tab: SelectedTab) => dispatch({ type: "selectTab", payload: tab });
}

export function SelectedDataTabProvider({ children }: { children: React.ReactNode }) {
  const [value, dispatch] = useReducer(
    selectedTabReducer,
    "all",
  );

  return (
    <SelectedDataTabContext.Provider value={value}>
      <SelectedDataTabDispatchContext.Provider value={dispatch}>
        {children}
      </SelectedDataTabDispatchContext.Provider>
    </SelectedDataTabContext.Provider>
  );
}

export function TabsWithSelectedContext({ children }: { children: React.ReactNode }) {
  return (
    <SelectedDataTabProvider>
      <InnerTabs>
        {children}
      </InnerTabs>
    </SelectedDataTabProvider>
  );
}

function InnerTabs({ children }: { children: React.ReactNode }) {
  const tabSelected = useSelectedTab();
  const setTabSelected = useSelectTab();

  return (
    <Tabs value={tabSelected} onValueChange={setTabSelected}>
      {children}
    </Tabs>
  );
}
