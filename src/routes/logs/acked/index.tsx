import LogsPage from "@/components/log/LogsPage";

export default function LogsRoute() {
  return (
    <>
      <LogsPage sourceId={undefined} ackNack="ack" />
    </>
  );
}