import { Alert } from "@/components/ui/alert";
import { useAckedDataLength, useNotAckedDataLength } from "@/data/logData/logDataHooks";
import { logDataSliceActions } from "@/data/logData/logDataSlice";
import { useContext } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { useAckNack } from "./context/AckNackContext";
import { SelectedSourceContext } from "./context/SelectedSourceContext";
import SimpleTooltip from "./SimpleTooltip";
import { Button } from "./ui/button";
import { Toggle } from "./ui/toggle";

export function StatsLine() {
  const notAckedDataLength = useNotAckedDataLength();
  return (
    <Alert className="text-size-min">
      <CountOfAckMessages />
      <AckAllOnSourceButton notAckedCount={notAckedDataLength} />
    </Alert>
  );
}

function CountOfAckMessages() {
  const ackNack = useAckNack();
  const ackedMessagesCount: number = useAckedDataLength();
  const toggleLink = ackNack === "ack" ? "/logs/" : "/logs/acked";
  // TODO: why don't we see a proper toggle, but a button instead? :thinking_face:
  return (
    <Link to={toggleLink} data-testid="toggle-ack-nack">
      <Toggle data-testid="acked-messages-count" size="sm">ACK'ed {ackedMessagesCount}</Toggle>
    </Link>
  );
}

export function AckAllOnSourceButton({ notAckedCount }: { notAckedCount: number }) {
  const dispatch = useDispatch();
  const selectedSource = useContext(SelectedSourceContext);
  const { ackAll } = logDataSliceActions;

  return (
    <AckAllButton
      notAckedCount={notAckedCount}
      onClick={() => dispatch(ackAll({ type: "sourceId", sourceId: selectedSource?.sourceId }))}
    />
  );
}

export function AckAllButton({ notAckedCount, onClick }: { notAckedCount: number; onClick: () => void }) {
  const ackNack = useAckNack();
  if (!notAckedCount) {
    return null;
  }
  return (
    <span className="pl-2">
      <SimpleTooltip
        content={
          <>
            <p>ACK all pending messages.</p>
          </>
        }
      >
        <Button
          data-testid="ack-all-button"
          disabled={ackNack == "ack"}
          onClick={() => {
            onClick();
          }}
          variant="secondary"
          size="sm"
        >
          ACK {notAckedCount}
        </Button>
      </SimpleTooltip>
    </span>
  );
}
