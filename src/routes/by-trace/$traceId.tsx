import { columnsNoTraces } from "@/components/columns";
import { DataTable } from "@/components/data-table";
import { AckAllButton } from "@/components/StatsLine";
import { useTraceIdLogs } from "@/data/logData/logDataHooks";
import { logDataSliceActions } from "@/data/logData/logDataSlice";
import { LogWithSource } from "@/data/logData/logSchema";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";

export default function LogsByTraceId() {
  const { traceId = "" } = useParams();
  const traceIdLogs = useTraceIdLogs(traceId || "");
  return (
    <>
      <h1 className="font-bold">Trace ID: {traceId}</h1>
      <AckAllOnTraceViewButton data={traceIdLogs} />
      <SourcesData data={traceIdLogs} />
    </>
  );
}

function SourcesData({ data }: { data: LogWithSource[] }) {
  return (
    <div className="mt-2 space-y-4">
      <DataTable data={data} columns={columnsNoTraces} />
    </div>
  );
}

function AckAllOnTraceViewButton({ data }: { data: LogWithSource[] }) {
  const dispatch = useDispatch();
  const { ackAll } = logDataSliceActions;

  const notAckedCount = data.filter(p => p.acked === null).length;

  return (
    <AckAllButton
      notAckedCount={notAckedCount}
      onClick={() => dispatch(ackAll({ type: "ids", ids: data.map(l => l.id) }))}
      ackNack="nack"
    />
  );
}
