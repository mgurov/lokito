import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const lokiUrl = env.LOKI_URL || "http://localhost:3100/loki/";
  return {
    plugins: [react()],
    server: {
      port: 5174,
      proxy: {
        "/loki-proxy": {
          target: lokiUrl,
          rewrite: (path) => path.replace(/^\/loki-proxy/, ""),
        },
      },
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
