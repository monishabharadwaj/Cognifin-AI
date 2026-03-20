import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "localhost",
    port: 8080,
    hmr: { overlay: false },
    proxy: {
      // Main Node.js backend — all /api/* calls
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },

      // FastAPI ML service — all /ml/* calls are stripped of /ml prefix
      // then forwarded to http://127.0.0.1:8000
      // e.g. POST /ml/financial_chat → POST http://127.0.0.1:8000/financial_chat
      "/ml": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/ml/, ""),
      },

      // WebSocket support for backend (optional)
      "/socket.io": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
}));
