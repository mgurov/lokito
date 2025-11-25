import { LogList } from "@/components/log/list/LogList";
import FilterCard from "@/components/rule/FilterCard";
import { AckAllButton } from "@/components/StatsLine";
import { useFilter } from "@/data/filters/filtersSlice";
import { useFilterLogs } from "@/data/logData/logDataHooks";
import { logDataSliceActions } from "@/data/logData/logDataSlice";
import { LogWithSource } from "@/data/logData/logSchema";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";

export default function LogsByFilterId() {
  const { filterId = "" } = useParams();
  const filter = useFilter(filterId);
  const logs = useFilterLogs(filterId || "");
  if (!filter) {
    return <h2 className="font-bold">No such filter id: {filterId}</h2>;
  }
  return (
    <>
      <h2 className="font-bold">Filter: {filterId}</h2>
      <AckAllOnFilterViewButton data={logs} filterId={filterId} />

      <FilterCard filter={filter} hideId />

      <div className="mt-2 space-y-4">
        <LogList data={logs} hideFilterId={filterId} />
      </div>
    </>
  );
}

function AckAllOnFilterViewButton({ data, filterId }: { data: LogWithSource[]; filterId: string }) {
  const dispatch = useDispatch();
  const { ack } = logDataSliceActions;

  const notAckedCount = data.filter(p => p.acked === null).length;

  return (
    <AckAllButton
      notAckedCount={notAckedCount}
      onClick={() => dispatch(ack({ type: "filterId", filterId }))}
      ackNack="nack"
    />
  );
}
