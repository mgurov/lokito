import { ColumnDef } from '@tanstack/react-table';

import { Log } from '../data/schema';
import { useDispatch } from 'react-redux';
import { Button } from './ui/button';
import { ack } from '@/data/redux/logDataSlice';
import { simpleDateTimeFormat } from '@/lib/utils';
import { CheckIcon } from '@radix-ui/react-icons';
import { useSelectTab } from './context/SelectedDataTabContext';

type LogSource = {
  color: string, name: string, id: string
}

type LogWithSource = Log & {source: LogSource}

function RowAck({ logId }: { logId: string }) {
  const dispatch = useDispatch();
  return (
    <Button
      data-testid="ack-message-button"
      size="icon"
      variant="ghost"
      className="hover:bg-gray-200"
      onClick={(e) => {
        dispatch(ack(logId));
        e.stopPropagation();
      }}
    >
      <CheckIcon className="h-4 w-4" />
    </Button>
  );
}

export function columns(showSource: boolean): ColumnDef<LogWithSource>[] {
  return columnsTemplate.filter(c => showSource || c.id !== "source")
}

const columnsTemplate: ColumnDef<LogWithSource>[] = [
  {
    id: 'source',
    accessorKey: 'source',
    cell: ({ getValue }) => {
      const selectTab = useSelectTab();
      const value = getValue<LogSource>();
      return (
        <>
          <div
            className="absolute left-0 top-0 h-full w-[3px]"
            // limitation of tailwind
            style={{ backgroundColor: value.color }}
            
          />
          <Button variant="ghost" size="sm" data-testid="log-row-source-marker" onClick={_e => {
              selectTab(value.id);
            }}>{value.name}</Button>
        </>
      )
    },
  },
  {
    id: 'ack',
    header: undefined,
    cell: ({ row }) => {
      return <RowAck logId={row.original.id} />;
    },
  },
  {
    accessorKey: 'timestamp',
    header: undefined,
    cell: ({ getValue }) => (
      <div className="h-full w-32 cursor-pointer text-xs tracking-tight" title={getValue<string>()}>
        {simpleDateTimeFormat(getValue<string>())}
      </div>
    ),
  },
  {
    accessorKey: 'line',
    header: undefined,
    cell: ({ getValue }) => (
      <div className="h-full cursor-pointer overflow-auto whitespace-nowrap text-xs font-medium" data-testid="log-message">
        {getValue<string>()}
      </div>
    ),
  },
];
