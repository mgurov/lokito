import { AckNackProvider } from "./context/AckNackContext";
import { NoActiveSourcesHint, ShowData } from "./ShowData";

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
