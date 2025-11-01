import { Link } from "react-router-dom";

import { GoogleIcon } from "@/components/ui/icons/GoogleIcon";
import { LokitoLogo } from "@/components/ui/icons/lokito-logo";
import { Button } from "@/components/ui/shadcn/button";

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
    </div>
  );
}
