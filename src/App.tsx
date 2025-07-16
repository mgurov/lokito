import { Link, Outlet, RouterProvider, useLocation } from "react-router-dom";

import "./App.css";
import { Toaster } from "@/components/ui/sonner";
import { store } from "@/data/redux/store";
import { useEffect } from "react";
import { Provider } from "react-redux";
import { Button } from "./components/ui/button";
import { LokitoLogo } from "./components/ui/lokito-logo";
import { TooltipProvider } from "./components/ui/tooltip";
import { useNotAckedDataLength } from "./data/logData/logDataHooks";
import { createRouter } from "./routing";

function App() {
  const router = createRouter({ layout: <Layout /> });

  return (
    <>
      <Provider store={store}>
        <TooltipProvider delayDuration={100}>
          <RouterProvider router={router} />
        </TooltipProvider>
      </Provider>
    </>
  );
}

function Layout() {
  const l = useLocation();
  const acked = l.pathname.includes("/acked");
  const extraClasses = acked ? "bg-stone-100" : "";
  return (
    <>
      <div
        style={{
          lineHeight: "1.8",
        }}
        className={`font-sans flex h-full flex-1 flex-col px-8 py-4 min-h-full ${extraClasses}`}
      >
        <TopNavigation />
        <Outlet />
      </div>
      <Toaster /> {/* drop the toaster */}
      <DocumentTitleUpdater />
    </>
  );
}

function DocumentTitleUpdater() {
  const notAckedCount = useNotAckedDataLength();

  useEffect(() => {
    if (notAckedCount > 0) {
      document.title = `Lokito🔥${notAckedCount}`;
    } else {
      document.title = "Lokito";
    }
  }, [notAckedCount]);

  return null;
}

// TODO: move out the component
function TopNavigation() {
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
          Filters
        </Link>
      </Button>
    </div>
  );
}

export default App;
