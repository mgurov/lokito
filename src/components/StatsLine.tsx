import { Alert } from '@/components/ui/alert';
import { logDataSliceActions } from '@/data/logData/logDataSlice';
import { useAckedDataLength, useNotAckedDataLength } from '@/data/logData/logDataHooks';
import { Button } from './ui/button';
import { useDispatch } from 'react-redux';
import SimpleTooltip from './SimpleTooltip';
import { useContext } from 'react';
import { SelectedSourceContext } from './context/SelectedSourceContext';
import { useAckNack, useToggleAckNack } from './context/AckNackContext';
import { Toggle } from './ui/toggle';

export function StatsLine() {
  const notAckedDataLength = useNotAckedDataLength();
  return <Alert className="text-size-min">
    <CountOfAckMessages />
    <AckAllButton notAckedCount={notAckedDataLength} />
  </Alert>;
}

function CountOfAckMessages() {
  const toggleAckNack = useToggleAckNack();
  const ackedMessagesCount: number = useAckedDataLength();
  return <Toggle data-testid="acked-messages-count" size="sm" onClick={toggleAckNack}>ACK'ed {ackedMessagesCount}</Toggle>
}

export function AckAllButton({notAckedCount}: {notAckedCount: number}) {
  const ackNack = useAckNack();
  const dispatch = useDispatch()
  const selectedSource = useContext(SelectedSourceContext)
  const { ackAll } = logDataSliceActions
  if (!notAckedCount) {
    return null;
  }
  return (
    <span className="pl-2">
      <SimpleTooltip content={<><p>ACK all pending messages.</p></>}>
        <Button data-testid="ack-all-button" disabled={ackNack == 'ack'} onClick={() => { dispatch(ackAll(selectedSource?.sourceId)) }} variant="secondary" size="sm">ACK {notAckedCount}</Button>
      </SimpleTooltip>

    </span>
  )
}