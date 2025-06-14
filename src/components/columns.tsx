import { ColumnDef } from '@tanstack/react-table';

import { LogWithSource, LogSource, Acked } from '../data/logData/logSchema';
import { useDispatch } from 'react-redux';
import { Button } from './ui/button';
import { ack, unack } from '@/data/logData/logDataSlice';
import { simpleDateTimeFormat } from '@/lib/utils';
import { CheckIcon, MinusIcon } from '@radix-ui/react-icons';
import { useSelectTab } from './context/SelectedDataTabContext';
import { useContext } from 'react';
import { SelectedSourceContext, useSelectedSourceMessageLine } from './context/SelectedSourceContext';
import React from 'react';
import { ackMatchedByFilter } from '@/data/filters/filtersSlice';
import { useTraceIdsMultipleMatchesCount } from '@/data/logData/logDataHooks';
import { Link } from 'react-router-dom';


function RowAck({ logId, acked }: { logId: string, acked: Acked }) {
  const dispatch = useDispatch();
  const ActionIcon = acked ? MinusIcon : CheckIcon;
  return (
    <Button
      data-testid={acked ? "unack-message-button" : "ack-message-button" }
      size="icon"
      variant="ghost"
      className="hover:bg-gray-200"
      onClick={(e) => {
        const action = acked ? unack : ack;
        dispatch(action(logId));
        e.stopPropagation();
      }}
    >
      <ActionIcon className="h-4 w-4" />
    </Button>
  );
}

export function columns(opts: {showTraces?: boolean} = {}): ColumnDef<LogWithSource>[] {

  const columnsTemplate: ColumnDef<LogWithSource>[] = [
    {
      id: 'source',
      accessorKey: 'sources',
      cell: ({ getValue }) => {
        const value = getValue<LogSource[]>();
        return (
          <>
            <div
              className="absolute left-0 top-0 h-full w-[3px]"
              // limitation of tailwind
              style={{ backgroundColor: value[0]?.color }}
            />
          </>
        )
      },
    },
    {
      id: 'ack',
      header: undefined,
      cell: ({ row }) => {
        return <RowAck logId={row.original.id} acked={row.original.acked} />;
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
      cell: ({ row }) => <RenderLine row={row.original} showTraces={opts.showTraces ?? true} />,
    },
  ];

  return columnsTemplate;
}

function RenderLine({row, showTraces}: {row: LogWithSource, showTraces: boolean}) {
  const stringToShow = useSelectedSourceMessageLine(row)
  return (
    <>
      <div className="h-full cursor-pointer overflow-auto whitespace-nowrap text-xs font-medium">
        <SourceIndicator row={row} />
        <FilterIndicators row={row} />
        {showTraces && <TraceIndicators row={row} />}
        <span data-testid="log-message">{stringToShow}</span>
      </div>
    </>
  )
}

function SourceIndicator({row}: {row: LogWithSource}) {
  const selectedSource = useContext(SelectedSourceContext)
  const selectTab = useSelectTab();
  const sourcesToShow = row.sources.filter(s => s.id !== selectedSource?.sourceId)
  return sourcesToShow.map(source => (
    <React.Fragment key={source.id} ><Button variant="ghost" size="sm" data-testid="log-row-source-marker" className="border boder-red-50" onClick={_e => {
      selectTab(source.id);
    }}>{source.name}</Button>{' '}</React.Fragment>
  ));
}

function FilterIndicators({row}: {row: LogWithSource}) {
  const dispatch = useDispatch();
  return Object.entries(row.filters).map(([id, name]) => (
    <React.Fragment key={id} >
      <Button variant="ghost" size="sm" data-testid="matching-filter" className="border boder-red-50"
        onClick={_e => {
          dispatch(ackMatchedByFilter(id));
        }}
      >{name}</Button>{' '}
    </React.Fragment>
  ));
}

function TraceIndicators({row}: {row: LogWithSource}) {
  const traceIdsMultipleMatchesCount = useTraceIdsMultipleMatchesCount(row);
  return Object.entries(traceIdsMultipleMatchesCount).map(([traceId, count]) => (
    <React.Fragment key={traceId} >
      <Button 
        variant="ghost" size="sm" data-testid="trace-button" className="border boder-yellow-50"
        title={`trace: ${traceId}`}
        asChild
      ><Link to={`/by-trace/${traceId}`}>✜ {count}</Link></Button>{' '}
    </React.Fragment>
  ));
}

