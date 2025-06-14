import { columns } from "@/components/columns";
import { DataTable } from "@/components/data-table";
import { useTraceIdLogs } from "@/data/logData/logDataHooks";
import { LogWithSource } from "@/data/logData/logSchema";
import { useParams } from "react-router-dom"

export default function LogsByTraceId() {
    const {traceId} = useParams()
    const traceIdLogs = useTraceIdLogs(traceId || '')
    return (<>
        <h1 className="font-bold">Trace ID: {traceId}</h1>
        <SourcesData data={traceIdLogs} />
        </>
    )
}

function SourcesData({ data }: { data: LogWithSource[] }) {
  return (
    <div className="mt-2 space-y-4">
      <DataTable data={data} columns={columns({showTraces: false})} />
    </div>
  );
}
