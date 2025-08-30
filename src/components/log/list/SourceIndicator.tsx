import { SelectedSourceContext } from "@/components/context/SelectedSourceContext";
import { Button } from "@/components/ui/button";
import { LogWithSource } from "@/data/logData/logSchema";
import { useContext } from "react";
import React from "react";
import { Link } from "react-router-dom";

export function SourceIndicator({ row }: { row: LogWithSource }) {
  const selectedSource = useContext(SelectedSourceContext);
  const sourcesToShow = row.sources.filter(s => s.id !== selectedSource?.sourceId);
  return sourcesToShow.map(source => (
    <React.Fragment key={source.id}>
      <Link to={`/logs/${source.id}`}>
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
