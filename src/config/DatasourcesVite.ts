import { Plugin, PreviewServer, ProxyOptions, ViteDevServer } from "vite";
import { datasourcesOverWireSchema, ServerDatasource, validateConfig } from "./config-schema";

export async function datasourcesVitePlugin({ datasourcesFileName }: { datasourcesFileName: string }): Promise<Plugin> {
  // eslint-disable-next-line no-console
  console.info("Loading lokito config from", datasourcesFileName);
  const datasources = await loadDatasources(datasourcesFileName);
  const datasourcesJson = JSON.stringify(datasourcesOverWireSchema.parse(datasources));
  const proxy = buildProxies(datasources);
  const configureServerReturnDatasources = (server: ViteDevServer | PreviewServer) => {
    server.middlewares.use("/config/data-sources", (_req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.end(datasourcesJson);
    });
  };
  return {
    name: "vite-plugin-loki-datasources",
    configureServer: configureServerReturnDatasources,
    configurePreviewServer: configureServerReturnDatasources,
    config: () => ({
      server: {
        proxy,
      },
      preview: {
        proxy,
      },
    }),
  };
}

async function loadDatasources(fileName: string): Promise<Array<ServerDatasource>> {
  const { default: datasources } = await import(fileName);
  return validateConfig(datasources);
}

function buildProxies(datasources: Array<ServerDatasource>): Record<string, string | ProxyOptions> {
  const proxies: Record<string, string | ProxyOptions> = {};

  for (const ds of datasources) {
    const ourUrl = `/loki-proxy/${ds.id}`;
    proxies[ourUrl] = {
      target: ds.url,
      rewrite: (path: string) => path.slice(ourUrl.length),
    };
    if (ds.headers) {
      proxies[ourUrl].configure = (proxy) => {
        proxy.on("proxyReq", (proxyReq) => {
          for (const [key, value] of Object.entries(ds.headers || {})) {
            proxyReq.setHeader(key, value);
          }
        });
      };
    }
    // eslint-disable-next-line no-console
    console.info("Proxying", ourUrl, "→", ds.url);
  }

  return proxies;
}
