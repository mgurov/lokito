import { Alert } from '@/components/ui/alert';
import { logDataSliceActions, useAckedDataLength, useNotAckedDataLength } from '@/data/redux/logDataSlice';
import { Button } from './ui/button';
import { useDispatch } from 'react-redux';

export function StatsLine() {
  return <Alert className="text-size-min">
    <CountOfAckMessages/>
    <AckAllButton/>
  </Alert>;
}

function CountOfAckMessages() {
  const ackedMessagesCount: number = useAckedDataLength();
  return <span data-testid="acked-messages-count">{ackedMessagesCount} ACK'ed</span>;
}

function AckAllButton() {
  const notAckedDataLength = useNotAckedDataLength()
  const dispatch = useDispatch()
  const {ackAll} = logDataSliceActions
  if (!notAckedDataLength) {
    return null;
  }
  return <span className="pl-2"><Button data-testid="ack-all-button" onClick={() => {dispatch(ackAll())}} variant="secondary" size="sm">ACK {notAckedDataLength}</Button></span>
}