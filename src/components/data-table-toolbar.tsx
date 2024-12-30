import { Table } from '@tanstack/react-table';
import { DataTableFacetedFilter } from '@/components/data-table-faceted-filter';
import { DataTableViewOptions } from '@/components/data-table-view-options';

import { Input } from '@/components/ui/input';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
  sources,
}: DataTableToolbarProps<TData> & { sources: unknown[] }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter tasks..."
          value={(table.getColumn('line')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('line')?.setFilterValue(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn('source') && (
          <DataTableFacetedFilter
            column={table.getColumn('source')}
            title="Source"
            // TODO
            // @ts-expect-error - Fix types
            options={sources.map((source: { name: string }) => ({
              label: source.name,
              value: source.name,
            }))}
          />
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
