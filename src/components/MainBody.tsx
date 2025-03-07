import FetchingControl from '@/components/fetching-control';
import { NoActiveSourcesHint, ShowData } from './main-body';
import { AckNackProvider } from './context/AckNackContext';

export default function MainBody() {
  return (
    <div>
      <NoActiveSourcesHint />
      {/* TODO: Create a toolbox area with everything: pages and search configuration. One block */}
      <FetchingControl />
      <AckNackProvider>
        <ShowData />
      </AckNackProvider>
    </div>
  );
}
