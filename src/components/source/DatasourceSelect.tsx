import { useContext } from "react";
import { DatasourcesContext } from "../config/LoadedConfigurationContext";

export interface DatasourceSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  showEmptyOptionOnNoDefaultValue?: boolean;
}

export function DatasourceSelect({ showEmptyOptionOnNoDefaultValue, ...selectProps }: DatasourceSelectProps) {
  const datasources = useContext(DatasourcesContext);

  return (
    <select data-testid="datasource-select" {...selectProps}>
      {!selectProps.defaultValue && showEmptyOptionOnNoDefaultValue && <option>Select Datasource</option>}
      {Object.values(datasources).map(ds => <option key={ds.id} value={ds.id}>{ds.alias || ds.id}</option>)}
    </select>
  );
}
