import {
  ColumnDef,
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";

import { LogPanel } from "@/components/log/LogPanel";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useOverallFetchingState } from "@/data/fetching/fetchingSlice";
import { Log, LogWithSource } from "@/data/logData/logSchema";
import { cn } from "@/lib/utils";
import { DataTablePagination } from "./data-table-pagination";

interface DataTableProps {
  columns: ColumnDef<LogWithSource>[];
  data: LogWithSource[];
}

// TODO: move to redux together with interceptor logic
const REFRESH_RATE = 60;

export function DataTable({ columns, data }: DataTableProps) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const table = useReactTable<LogWithSource>({
    data,
    columns,
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
    state: {
      rowSelection,
      expanded,
    },
    getRowId: (row: Log) => row.id,
    enableRowSelection: true,
    enableExpanding: true,
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });
  const now = new Date().getTime();

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableBody>
            {table.getRowModel().rows?.length
              ? (
                table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <TableRow
                      data-testid="log-table-row"
                      data-state={row.getIsSelected() && "selected"}
                      className={cn(
                        now - new Date(row.original.timestamp).getTime() < 1000 * REFRESH_RATE
                          && "transform-gpu bg-green-50 transition-all duration-700 ease-out",
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cn("relative", cell.column.id === "line" && "w-full")}
                          {...(cell.column.id !== "source" && cell.column.id !== "ack"
                            ? {
                              role: "button",
                              tabIndex: 0,
                              onClick: () => row.toggleExpanded(),
                              onKeyDown: (event) => {
                                if (event.key === "Enter") {
                                  row.toggleExpanded();
                                }
                              },
                            }
                            : {})}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    {row.getIsExpanded() && (
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={columns.length}>
                          <MemoedLogRowPanel log={row.original} />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )
              : <NoData />}
          </TableBody>
        </Table>
      </div>
      {table.getRowModel().rows?.length > 0 && <DataTablePagination table={table} />}
    </div>
  );
}

function MemoedLogRowPanel({ log }: { log: Log }) {
  const { stream, ...lessMutable } = log;
  const memoKey = JSON.stringify(lessMutable);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useMemo(() => <LogPanel log={log} />, [memoKey]);
}

function NoData() {
  const overallState = useOverallFetchingState();
  return (
    <TableRow>
      <TableCell colSpan={4} className="h-24 text-center">
        {overallState.from !== null && "Clean ✅"}
      </TableCell>
    </TableRow>
  );
}
