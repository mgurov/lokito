import { NoActiveSourcesHint, ShowData } from './ShowData';
import { AckNackProvider } from './context/AckNackContext';

export default function MainBody() {
  return (
    <div>
      <NoActiveSourcesHint />
      <AckNackProvider>
        <ShowData />
      </AckNackProvider>
    </div>
  );
}
