import { useJustAckedBacklogLength, useJustUnackedBacklogLength } from "@/data/logData/logDataHooks";

export default function TechDetails() {
  const justAckedBacklog = useJustAckedBacklogLength();
  const justUnackedBacklog = useJustUnackedBacklogLength();

  return (
    <div>
      <h1>Tech details</h1>
      <div data-testid="acked-backlog">{justAckedBacklog}</div>
      <div data-testid="unacked-backlog">{justUnackedBacklog}</div>
    </div>
  );
}
