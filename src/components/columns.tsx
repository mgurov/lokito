import { ColumnDef } from '@tanstack/react-table';

import { Log } from '../data/schema';
import { useDispatch } from 'react-redux';
import { Button } from './ui/button';
import { ack } from '@/data/redux/logDataSlice';
import { simpleDateTimeFormat } from '@/lib/utils';
import { CheckIcon } from '@radix-ui/react-icons';

function RowAck({ logId }: { logId: string }) {
  const dispatch = useDispatch();
  return (
    <Button
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

export const columns: ColumnDef<Log>[] = [
  {
    id: 'source',
    accessorKey: 'source',
    cell: ({ getValue }) => (
      <div
        className="absolute left-0 top-0 h-full w-[3px]"
        // limitation of tailwind
        style={{ backgroundColor: getValue<{ color: string }>().color }}
      />
    ),
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
