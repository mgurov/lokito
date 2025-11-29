import { Outlet, RouterProvider, useLocation } from "react-router-dom";

import "./App.css";
import { LoadConfiguration } from "@/components/config/LoadedConfigurationContext";
import TopNavigation from "@/components/TopNavigation";
import { Toaster } from "@/components/ui/shadcn/sonner";
import { TooltipProvider } from "@/components/ui/shadcn/tooltip";
import { store } from "@/data/redux/store";
import { createRouter } from "@/routing";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { DocumentTitleUpdater } from "./components/DocumentTitleUpdater";

function App() {
  const router = createRouter({ layout: <Layout /> });
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        networkMode: "always",
        retry: false,
      },
    },
  });

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <LoadConfiguration>
          <Provider store={store}>
            <TooltipProvider delayDuration={100}>
              <RouterProvider router={router} />
            </TooltipProvider>
          </Provider>
        </LoadConfiguration>
      </QueryClientProvider>
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

export default App;
