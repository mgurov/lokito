import { Alert } from '@/components/ui/alert';
import { logDataSliceActions, useAckedDataLength, useNotAckedDataLength } from '@/data/redux/logDataSlice';
import { Button } from './ui/button';
import { useDispatch } from 'react-redux';
import SimpleTooltip from './SimpleTooltip';
import { useContext } from 'react';
import { SelectedSourceContext } from './context/SelectedSourceContext';
import { useToggleAckNack } from './context/AckNackContext';

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
  return <Button data-testid="acked-messages-count" variant="ghost" onClick={toggleAckNack}>{ackedMessagesCount} ACK'ed</Button>;
}

export function AckAllButton({notAckedCount}: {notAckedCount: number}) {
  const dispatch = useDispatch()
  const selectedSource = useContext(SelectedSourceContext)
  const { ackAll } = logDataSliceActions
  if (!notAckedCount) {
    return null;
  }
  return (
    <span className="pl-2">
      <SimpleTooltip content={<><p>ACK all pending messages.</p></>}>
        <Button data-testid="ack-all-button" onClick={() => { dispatch(ackAll(selectedSource?.sourceId)) }} variant="secondary" size="sm">ACK {notAckedCount}</Button>

      </SimpleTooltip>


    </span>
  )
}