import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { createContext } from "react";
import { Alert } from "../ui/shadcn/alert";

export interface Datasource {
  id: string;
  name: string;
  url: string;
}

export const DatasourcesContext = createContext<Record<string, Datasource>>({});

export function LoadDatasources({ children }: { children: React.ReactNode }) {
  const { data, error, isPending, status } = useQuery({
    queryKey: ["datasources"],
    queryFn: loadDatasources,
  });

  if (isPending) {
    return <Alert data-testid="loki-datasources-loading">Loading Loki datasources configuration...{status}</Alert>;
  }

  if (error) {
    return <Alert data-testid="loki-datasources-error">Error fetching Loki datasources configuration.</Alert>;
  }

  if (!data || data.length === 0) {
    return <Alert data-testid="loki-datasources-empty">No Loki datasources have been configured.</Alert>;
  }

  return (
    <DatasourcesContext.Provider
      value={Object.fromEntries(
        data.map((ds) => [ds.id, ds]),
      )}
    >
      {children}
    </DatasourcesContext.Provider>
  );
}

async function loadDatasources(): Promise<Datasource[]> {
  const response = await axios.get<Datasource[]>("/config/data-sources");
  return response.data;
}
