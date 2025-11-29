import { useNotAckedDataLength } from "@/data/logData/logDataHooks";
import { useEffect } from "react";

export function DocumentTitleUpdater() {
  const notAckedCount = useNotAckedDataLength();

  useEffect(() => {
    if (notAckedCount > 0) {
      document.title = `Lokito🔥${notAckedCount}`;
    } else {
      document.title = "Lokito";
    }
    if (navigator.setAppBadge) {
      void navigator.setAppBadge(notAckedCount);
    }
  }, [notAckedCount]);

  return null;
}
