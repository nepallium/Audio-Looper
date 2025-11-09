import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  server: {
    https: {
      key: fs.readFileSync(
        path.resolve(__dirname, "certs/localhost+3-key.pem")
      ),
      cert: fs.readFileSync(path.resolve(__dirname, "certs/localhost+3.pem")),
    },
    host: true,
    port: 5173,
  },
});
