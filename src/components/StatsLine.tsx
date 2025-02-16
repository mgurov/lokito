import { Alert } from '@/components/ui/alert';
import { logDataSliceActions, useAckedDataLength, useNotAckedDataLength } from '@/data/redux/logDataSlice';
import { Button } from './ui/button';
import { useDispatch } from 'react-redux';
import SimpleTooltip from './SimpleTooltip';

export function StatsLine() {
  return <Alert className="text-size-min">
    <CountOfAckMessages />
    <AckAllButton />
  </Alert>;
}

function CountOfAckMessages() {
  const ackedMessagesCount: number = useAckedDataLength();
  return <span data-testid="acked-messages-count">{ackedMessagesCount} ACK'ed</span>;
}

function AckAllButton() {
  const notAckedDataLength = useNotAckedDataLength()
  const dispatch = useDispatch()
  const { ackAll } = logDataSliceActions
  if (!notAckedDataLength) {
    return null;
  }
  return (
    <span className="pl-2">
      <SimpleTooltip content={<><p>ACK all pending messages.</p><p className="">NB: doesn't respect the source selection, so will ack all messages from all sources.</p></>}>
        <Button data-testid="ack-all-button" onClick={() => { dispatch(ackAll()) }} variant="secondary" size="sm">ACK {notAckedDataLength}</Button>

      </SimpleTooltip>


    </span>
  )
}