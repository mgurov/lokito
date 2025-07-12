import LogsPage from "@/components/log/LogsPage";
import { useParams } from "react-router-dom";

export default function LogsRoute() {
  const { sourceId } = useParams<{ sourceId: string }>();
  return (
    <>
      <LogsPage sourceId={sourceId} ackNack="nack" />
    </>
  );
}
