import { AckNackProp } from "@/components/context/AckNackContext";
import { SelectedSourceContext } from "@/components/context/SelectedSourceContext";
import { Button } from "@/components/ui/shadcn/button";
import { LogWithSource } from "@/data/logData/logSchema";
import { useContext } from "react";
import React from "react";
import { Link } from "react-router-dom";

export function SourceButtons({ row, ackNack }: { row: LogWithSource } & AckNackProp) {
  const selectedSource = useContext(SelectedSourceContext);
  const sourcesToShow = row.sources.filter(s => s.id !== selectedSource?.sourceId);
  const logUrlPrefix = `/logs${ackNack === "ack" ? "/acked" : ""}`;
  return sourcesToShow.map(source => (
    <React.Fragment key={source.id}>
      <Link to={`${logUrlPrefix}/${source.id}`}>
        <Button
          variant="ghost"
          size="sm"
          data-testid="log-row-source-marker"
          className="border"
        >
          {source.name}
        </Button>
      </Link>
      {" "}
    </React.Fragment>
  ));
}

export function sourcesLineStyle(colors: Array<{ color: string }>) {
  if (colors.length === 1) {
    return { background: colors[0].color };
  }
  const gradient = colors.map(({ color }, index) => `${color} ${100 / (colors.length - 1) * index}%`).join(",");
  return { background: `linear-gradient(0deg,${gradient})` };
}
