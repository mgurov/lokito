import { AckNackProp } from "@/components/context/AckNackContext";
import { SelectedSourceContext } from "@/components/context/SelectedSourceContext";
import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import { LogWithSource } from "@/data/logData/logSchema";
import { useContext } from "react";
import React from "react";
import { Link } from "react-router-dom";

export function SourceIndicator({ row, ackNack }: { row: LogWithSource } & AckNackProp) {
  const selectedSource = useContext(SelectedSourceContext);
  const sourcesToShow = row.sources.filter(s => s.id !== selectedSource?.sourceId);
  const logUrlPrefix = `/logs${ackNack === "ack" ? "/acked" : ""}`;
  return sourcesToShow.map(source => (
    <React.Fragment key={source.id}>
      <Link to={`${logUrlPrefix}/${source.id}`}>
        <Button
          size="sm"
          data-testid="log-row-source-marker"
          asChild
        >
          <Badge style={{ backgroundColor: source.color }}>
            {source.name}
          </Badge>
        </Button>
      </Link>
    </React.Fragment>
  ));
}
