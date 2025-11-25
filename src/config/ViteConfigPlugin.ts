import { Plugin, PreviewServer, ProxyOptions, ViteDevServer } from "vite";
import { Config, datasourcesOverWireSchema, ServerDatasource, validateConfig } from "./config-schema";

export async function lokiConfigVitePlugin({ configFileName }: { configFileName: string }): Promise<Plugin> {
  // eslint-disable-next-line no-console
  console.info("Loading lokito config from", configFileName);
  const config = await loadConfig(configFileName);
  const configJson = JSON.stringify({
    datasources: datasourcesOverWireSchema.parse(config.datasources),
    features: config.features,
  });
  const proxy = buildDatasourceProxies(config.datasources);
  const configureServerReturnDatasources = (server: ViteDevServer | PreviewServer) => {
    server.middlewares.use("/config", (_req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.end(configJson);
    });
  };
  return {
    name: "vite-plugin-loki-config",
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

async function loadConfig(fileName: string): Promise<Config> {
  const { default: config } = await import(fileName);
  return validateConfig(config);
}

function buildDatasourceProxies(datasources: Array<ServerDatasource>): Record<string, string | ProxyOptions> {
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
