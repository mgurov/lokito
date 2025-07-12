import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    proxy: {
      "/lokiprod": {
        // http://localhost:3100/loki/api/v1/query_range?direction=BACKWARD&end=1752322399018319000&limit=30&query=%7Bservice_name%3D%22dice-server%22%7D&start=1752228000000000000
        target: "http://localhost:3100/loki/",
        rewrite: (path) => path.replace(/^\/lokiprod/, ""),
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
});
