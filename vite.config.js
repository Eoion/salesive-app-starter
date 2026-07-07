import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The Node server (server/index.js) consumes this build:
//   • dev  → Vite runs in middleware mode INSIDE Express (same port, with HMR)
//   • prod → `vite build` emits ./dist, which Express serves statically
// So there is only ever one port for the whole app.
export default defineConfig({
    plugins: [react()],
    build: { outDir: "dist", emptyOutDir: true },
});
