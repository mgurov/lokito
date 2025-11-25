import react from "@vitejs/plugin-react";
import path from "path";
import { resolve } from "path";
import { defineConfig, loadEnv } from "vite";
import { lokiConfigVitePlugin } from "./src/config/ViteConfigPlugin";

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const configFile = resolve(__dirname, env.LOKITO_CONFIG_FILE || "./config/test-config.js");

  return {
    plugins: [react(), await lokiConfigVitePlugin({ configFileName: configFile })],
    server: {
      port: 5174,
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
