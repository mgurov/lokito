import { useShouldWarnFetchingFailures } from "@/data/fetching/fetchingSlice";
import { useNotAckedDataLength } from "@/data/logData/logDataHooks";
import { useEffect } from "react";

export function DocumentTitleUpdater() {
  const notAckedCount = useNotAckedDataLength();
  const shouldWarnFetchingFailures = useShouldWarnFetchingFailures();

  useEffect(() => {
    let title = "Lokito";
    if (notAckedCount > 0) {
      title += "🔥" + notAckedCount;
    }
    if (shouldWarnFetchingFailures) {
      title += "⚠️";
    }
    document.title = title;
    if (navigator.setAppBadge) {
      void navigator.setAppBadge(notAckedCount + (shouldWarnFetchingFailures ? 1 : 0));
    }
  }, [notAckedCount, shouldWarnFetchingFailures]);

  return null;
}
