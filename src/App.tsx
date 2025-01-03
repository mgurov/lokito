import { RouterProvider, Outlet, Link } from "react-router-dom";

import './App.css'
import { createRouter } from './routing';
import { Provider } from 'react-redux';
import { store } from '@/data/redux/store';
import { Toaster } from "@/components/ui/sonner";
import {LokitoLogo} from "./components/ui/lokito-logo";


function App() {
  const router = createRouter({ layout: <Layout /> })

  return (
    <>
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </>
  )
}

function Layout() {
  return (
    <>
      <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.8' }}>
        <div className="flex h-full flex-1 flex-col px-8 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">
              <Link to="/">
                <div className="h-auto w-14 p-0">
                  <LokitoLogo />
                </div>
              </Link>
            </h2>
          </div>
          <Outlet />
        </div>
      </div>
      <Toaster />
    </>
  )
}


export default App
