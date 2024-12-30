import { ReactNode } from "react";
import { ActionFunction, createBrowserRouter, LoaderFunction, RouteObject } from "react-router-dom";

/**
 * A simplistic file-based router inspired by https://dev.to/franciscomendes10866/file-based-routing-using-vite-and-react-router-3fdo 
 */

const pages = import.meta.glob("./routes/**/*.tsx", { eager: true });
const pageRegex = /\.\/routes\/(.*)\.tsx$/;

function pathsToRoutes(): RouteObject[] {
    const routes: RouteObject[] = [];
    for (const path of Object.keys(pages)) {
        const fileName = path.match(pageRegex)?.[1];
        if (!fileName) {
            console.error(`unexpected non-match of ${path} to ${pageRegex}`);
            continue;
        }

        const deflat = fileName.split('/').flatMap(pathPart => pathPart.split('.'))

        const normalizedPathName = deflat.flatMap((pathParticle) => {
            if (pathParticle === "index") {
                return []
            }
            if (pathParticle.startsWith('$')) {
                return [pathParticle.replace("$", ":")]
            }
            return [pathParticle]
        }).join('/')

        const page = pages[path] as {
            default: React.FunctionComponent,
            loader?: LoaderFunction,
            action?: ActionFunction,
            ErrorBoundary?: React.FunctionComponent,
        }

        if (!page.default) {
            throw Error(`Page on path ${path} doesn't have required default export`)
        }

        const ErrorBoundary = page.ErrorBoundary;

        routes.push({
            path: fileName === "index" ? "/" : `/${normalizedPathName}`,
            Component: page.default,
            loader: page.loader,
            action: page.action,
            ...( ErrorBoundary && {errorElement: <ErrorBoundary/>} )
        });
    }
    return routes;
}

export function createRouter(props?: {layout?: ReactNode}) {
    const pageRoutes = pathsToRoutes()
    const routes: RouteObject[] = props?.layout ? [{
        path: "/",
        element: props.layout,
        children: pageRoutes
    }] : pageRoutes
    return createBrowserRouter(routes);
}