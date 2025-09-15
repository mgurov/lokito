import react from "@vitejs/plugin-react";
import path from "path";
import { resolve } from "path";
import { defineConfig, loadEnv, Plugin, PreviewServer, ProxyOptions, ViteDevServer } from "vite";
import { Datasource, loadDatasources } from "./src/config/config-schema";

const datasourcesPlugin = ({ datasources }: { datasources: Array<Datasource> }): Plugin => {
  const datasourcesJson = JSON.stringify(datasources);
  const configureServer = (server: ViteDevServer | PreviewServer) => {
    server.middlewares.use("/config/data-sources", (_req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.end(datasourcesJson);
    });
  };
  return {
    name: "vite-plugin-loki-datasources",
    configureServer,
    configurePreviewServer: configureServer,
  };
};

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const configFile = resolve(__dirname, env.LOKITO_CONFIG_FILE || "./config/test-config.js");
  // eslint-disable-next-line no-console
  console.info("Loading config file", configFile);
  const datasources = await loadDatasources(configFile);

  const proxies: Record<string, string | ProxyOptions> = {};

  for (const dsRaw of datasources) {
    const ds = dsRaw as { id: string; url: string; xOrgID?: string };
    const ourUrl = `/loki-proxy/${ds.id}`;
    proxies[ourUrl] = {
      target: ds.url,
      rewrite: (path: string) => path.slice(ourUrl.length),
    };
    if (ds.xOrgID) {
      proxies[ourUrl].configure = (proxy) => {
        proxy.on("proxyReq", (proxyReq) => {
          proxyReq.setHeader("x-grafana-org-id", ds.xOrgID || "");
        });
      };
    }
    // eslint-disable-next-line no-console
    console.info("Proxying", ourUrl, "->", ds.url);
  }

  return {
    plugins: [react(), datasourcesPlugin({ datasources })],
    server: {
      port: 5174,
      proxy: proxies,
    },
    preview: {
      port: 5174,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    test: {
      include: ["./src/**/*.test.?(c|m)[jt]s?(x)"],
    },
  };
});
