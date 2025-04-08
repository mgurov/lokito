import { RouterProvider, Outlet, Link } from "react-router-dom";

import './App.css'
import { createRouter } from './routing';
import { Provider } from 'react-redux';
import { store } from '@/data/redux/store';
import { Toaster } from "@/components/ui/sonner";
import { LokitoLogo } from "./components/ui/lokito-logo";
import { Button } from "./components/ui/button";
import { TooltipProvider } from "./components/ui/tooltip";


function App() {
  const router = createRouter({ layout: <Layout /> })

  return (
    <>
      <Provider store={store}>
        <TooltipProvider delayDuration={100}>
          <RouterProvider router={router} />
        </TooltipProvider>
      </Provider>
    </>
  )
}

function Layout() {
  return (
    <>
      <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.8' }}>
        <div className="flex h-full flex-1 flex-col px-8 py-4">
          <TopNavigation />
          <Outlet />
        </div>
      </div>
      <Toaster />
    </>
  )
}

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
  )
}


export default App
