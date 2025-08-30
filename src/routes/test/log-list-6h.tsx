import { startFetching } from "@/data/fetching/fetchingSlice";
import { useAllData } from "@/data/logData/logDataHooks";

import { LogList } from "@/components/log/LogList";
import { subHours } from "date-fns";
import { useDispatch } from "react-redux";

export default function LogListTest() {
  const dispatch = useDispatch();
  dispatch(startFetching({ from: subHours(new Date(), 6).toISOString() }));
  return <RenderData />;
}

function RenderData() {
  const data = useAllData();
  return (
    <>
      <h2>Here goes the log list</h2>
      <LogList data={data} />
    </>
  );
}
