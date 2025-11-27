import { ClientConfig, ClientDatasource } from "@/config/config-schema";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { createContext } from "react";
import { Alert } from "../ui/shadcn/alert";

export const DatasourcesContext = createContext<Record<string, ClientDatasource>>({});
export const FeaturesContext = createContext<Record<string, boolean>>({});

export function LoadConfiguration({ children }: { children: React.ReactNode }) {
  const { data, error, isPending, status } = useQuery({
    queryKey: ["config"],
    queryFn: loadConfig,
  });

  if (isPending) {
    return <Alert data-testid="loki-config-loading">Loading Loki datasources configuration...{status}</Alert>;
  }

  if (error) {
    return <Alert data-testid="loki-config-error">Error fetching Loki datasources configuration.</Alert>;
  }

  if (!data || data.datasources.length === 0) {
    return <Alert data-testid="loki-config-empty">No Loki datasources have been configured.</Alert>;
  }

  const normalizedDatasources = Object.fromEntries(
    data.datasources.map((ds) => [ds.id, ds]),
  );

  return (
    <DatasourcesContext.Provider value={normalizedDatasources}>
      <FeaturesContext.Provider value={data.features || {}}>
        {children}
      </FeaturesContext.Provider>
    </DatasourcesContext.Provider>
  );
}

async function loadConfig(): Promise<ClientConfig> {
  const response = await axios.get<ClientConfig>("/config");
  return response.data;
}
