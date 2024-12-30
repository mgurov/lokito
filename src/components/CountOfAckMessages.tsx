import { Alert } from '@/components/ui/alert';
import { useAckedDataLength } from '@/data/redux/logDataSlice';

export function CountOfAckMessages() {
  const ackedMessagesCount: number = useAckedDataLength();
  return <Alert className="text-size-min">{ackedMessagesCount} ACK messages</Alert>;
}
