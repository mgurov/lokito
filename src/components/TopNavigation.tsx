import { Link } from "react-router-dom";

import { GoogleIcon } from "@/components/ui/icons/GoogleIcon";
import { LokitoLogo } from "@/components/ui/icons/lokito-logo";
import { Button } from "@/components/ui/shadcn/button";
import {
  fetchingActions,
  NORMAL_DELAY_BEFORE_REFRESH_SEC,
  useOverallFetchingStateStatus,
  useSecondsTillRefresh,
} from "@/data/fetching/fetchingSlice";
import { cn } from "@/lib/utils";
import { UpdateIcon } from "@radix-ui/react-icons";
import { useDispatch } from "react-redux";

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
    </div>
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
      style={{ background: `linear-gradient(${progressRatio * 90}deg, orange ${progressRatio * 100}%, yellow 100%)` }}
    >
      <UpdateIcon className={cn("mr-1", fetchingNow && "animate-spin")} /> <span>Fetch now</span>
    </Button>
  );
}
