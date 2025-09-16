import { SelectProps } from "@radix-ui/react-select";
import { useContext } from "react";
import { DatasourcesContext } from "../datasource/LoadedDatasourceContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/shadcn/select";

export interface DatasourceSelectProps extends SelectProps {
  id?: string;
  preselectFirst?: boolean;
}

export function DatasourceSelect({ id, preselectFirst, ...selectProps }: DatasourceSelectProps) {
  const datasources = useContext(DatasourcesContext);

  if (!selectProps.defaultValue && preselectFirst && Object.keys(datasources).length > 0) {
    selectProps.defaultValue = Object.keys(datasources)[0];
  }

  return (
    <div data-testid="datasource-select">
      <Select {...selectProps}>
        <SelectTrigger id={id}>
          <SelectValue data-testid="datasource-select-value" placeholder="Select Datasource..." />
        </SelectTrigger>
        <SelectContent>
          {Object.values(datasources).map(ds => <SelectItem key={ds.id} value={ds.id}>{ds.alias || ds.id}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
