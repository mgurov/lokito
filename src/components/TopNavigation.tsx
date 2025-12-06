import { Link } from "react-router-dom";

import { GoogleIcon } from "@/components/ui/icons/GoogleIcon";
import { LokitoLogo } from "@/components/ui/icons/lokito-logo";
import { Button } from "@/components/ui/shadcn/button";
import { FeatureToggles } from "@/config/config-schema";
import {
  fetchingActions,
  NORMAL_DELAY_BEFORE_REFRESH_SEC,
  useOverallFetchingStateStatus,
  useSecondsTillRefresh,
} from "@/data/fetching/fetchingSlice";
import { cn } from "@/lib/utils";
import { UpdateIcon } from "@radix-ui/react-icons";
import { useDispatch } from "react-redux";
import { useFeatureToggle } from "./config/LoadedConfigurationContext";

export default function TopNavigation() {
  return (
    <div className="flex gap-2 items-center mb-2">
      <Link data-testid="home-page-logo" to="/">
        <div className="h-auto w-14 p-0">
          <LokitoLogo />
        </div>
      </Link>

      <Button data-testid="sources-button" size="sm" variant="secondary" asChild>
        <Link to="/sources">
          Sources
        </Link>
      </Button>

      <Button data-testid="filters-button" size="sm" variant="secondary" asChild>
        <Link to="/filters">
          <GoogleIcon icon="filter-alt" /> Filters
        </Link>
      </Button>

      <FetchNowButton />

      <TechDetails />
    </div>
  );
}

function TechDetails() {
  const showTechDetails = useFeatureToggle(FeatureToggles.persistentAcks);
  if (!showTechDetails) {
    return null;
  }
  return (
    <Link data-testid="tech-details" to="/tech-details" className="invisible">
      tech-details
    </Link>
  );
}

function FetchNowButton() {
  const dispatch = useDispatch();
  const state = useOverallFetchingStateStatus();
  const secsTillRefresh = useSecondsTillRefresh();

  if (state === "idle") {
    return null;
  }

  const progressRatio = 1 - secsTillRefresh / NORMAL_DELAY_BEFORE_REFRESH_SEC;

  const fetchingNow = secsTillRefresh <= 0;

  return (
    <Button
      data-testid="force-fetch"
      size="sm"
      variant="secondary"
      onClick={() => dispatch(fetchingActions.fetchNow())}
      disabled={fetchingNow}
      className="relative overflow-hidden"
    >
      <UpdateIcon className={cn("mr-1", fetchingNow && "animate-spin")} /> <span>Fetch now</span>
      <div
        style={{ width: progressRatio * 100 + "%" }}
        className="transition-all ease-linear rounded-sm duration-1000 absolute bg-gray-400 bottom-0 left-0 h-1"
      >
      </div>
    </Button>
  );
}
