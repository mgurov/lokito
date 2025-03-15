import {FetchingControl} from '@/components/fetching-control';
import { NoActiveSourcesHint, ShowData } from './ShowData';
import { AckNackProvider } from './context/AckNackContext';

export default function MainBody() {
  return (
    <div>
      <NoActiveSourcesHint />
      <FetchingControl />
      <AckNackProvider>
        <ShowData />
      </AckNackProvider>
    </div>
  );
}
