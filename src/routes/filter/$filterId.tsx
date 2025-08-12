import { columns } from "@/components/columns";
import { DataTable } from "@/components/data-table";
import { AckAllButton } from "@/components/StatsLine";
import { useFilterLogs } from "@/data/logData/logDataHooks";
import { logDataSliceActions } from "@/data/logData/logDataSlice";
import { LogWithSource } from "@/data/logData/logSchema";
import { useMemo } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";

export default function LogsByFilterId() {
  const { filterId = "" } = useParams();
  const logs = useFilterLogs(filterId || "");
  const columnsNoThisFilter = useMemo(() => columns({ hideFilterId: filterId }), [filterId]);
  return (
    <>
      <h2 className="font-bold">Filter: {filterId}</h2>
      <AckAllOnFilterViewButton data={logs} filterId={filterId} />
      <div className="mt-2 space-y-4">
        <DataTable data={logs} columns={columnsNoThisFilter} />
      </div>
    </>
  );
}

function AckAllOnFilterViewButton({ data, filterId }: { data: LogWithSource[]; filterId: string }) {
  const dispatch = useDispatch();
  const { ackAll } = logDataSliceActions;

  const notAckedCount = data.filter(p => p.acked === null).length;

  return (
    <AckAllButton
      notAckedCount={notAckedCount}
      onClick={() => dispatch(ackAll({ type: "filterId", filterId }))}
      ackNack="nack"
    />
  );
}
