import * as React from "react";

import { cn } from "@/lib/utils";
import { Link, LinkProps, useLocation } from "react-router-dom";

const TabLink = React.forwardRef<
  HTMLAnchorElement,
  LinkProps
>(({ className, ...props }, ref) => {
  const location = useLocation();
  const isActive = location.pathname === props.to; // NB: won't work with path particle
  return (
    <Link
      ref={ref}
      data-state={isActive ? "active" : ""}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
        className,
      )}
      {...props}
    />
  );
});
TabLink.displayName = "TabLink";

export { TabLink };
