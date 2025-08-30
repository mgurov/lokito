import { Button } from "@/components/ui/shadcn/button";
import { ack, unack } from "@/data/logData/logDataSlice";
import { Acked } from "@/data/logData/logSchema";
import { cn } from "@/lib/utils";
import { CheckIcon, MinusIcon } from "@radix-ui/react-icons";
import { useDispatch } from "react-redux";

export function RowAck(
  { logId, acked, buttonClassName, iconClassName }: {
    logId: string;
    acked: Acked;
    buttonClassName?: string;
    iconClassName?: string;
  },
) {
  const dispatch = useDispatch();
  const ActionIcon = acked ? MinusIcon : CheckIcon;
  return (
    <Button
      data-testid={acked ? "unack-message-button" : "ack-message-button"}
      size="icon"
      variant="ghost"
      className={cn("hover:bg-gray-200", buttonClassName)}
      onClick={(e) => {
        const action = acked ? unack : ack;
        dispatch(action(logId));
        e.stopPropagation();
      }}
    >
      <ActionIcon className={cn("h-4 w-4", iconClassName)} />
    </Button>
  );
}
