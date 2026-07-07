import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import morgan from "morgan";
import { Server as IOServer } from "socket.io";
import { config, redirectUri, warnMissingConfig } from "./config.js";
import { store, initStore } from "./store.js";
import { attachSockets } from "./sockets.js";
import { registerRoutes } from "./routes/index.js";
import { serveFrontend } from "./frontend.js";
import { errorHandler } from "./middleware/errors.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

warnMissingConfig();

const app = express();
const server = http.createServer(app);
// Same-origin (the front end is served from this very server, even when embedded
// in the dashboard iframe), so socket.io needs no CORS config.
const io = new IOServer(server);
attachSockets(io);

// ── Middleware order matters; read top-to-bottom ──────────────────────────────

// 1) HTTP request logging — concise colored output in dev, Apache "combined" in prod.
//    Skip Vite HMR / asset requests so the log stays readable during development.
app.use(morgan(config.isProd ? "combined" : "dev", {
    skip: (req) => /^\/@(vite|fs|id)|^\/__vite|^\/node_modules/.test(req.path),
}));

// 2) Body parsing. Webhooks need the RAW bytes for HMAC verification, so mount
//    express.raw scoped to /webhooks BEFORE express.json. (body-parser sets a
//    _body flag that makes json skip an already-parsed request, so swapping these
//    two lines would silently break signature checks.)
app.use("/webhooks", express.raw({ type: "*/*", limit: "1mb" }));
app.use(express.json());

// 3) Backend routes (+ a JSON 404 for unmatched /api · /oauth · /webhooks).
registerRoutes(app, { io });

// 4) Front end — Vite middleware in dev, built dist + SPA fallback in prod. Mounted
//    after the backend so it only handles non-backend paths.
await serveFrontend(app, { root, server, isProd: config.isProd });

// 5) Error backstop — last, so it can catch errors from any layer above.
app.use(errorHandler);

// Pick the storage backend before accepting traffic (in-memory by default, MongoDB
// when MONGODB_URI is set). Never fatal — a MongoDB misconfig degrades to memory.
const storeKind = await initStore();

server.listen(config.port, () => {
    console.log(
        `\n  Salesive app starter → http://localhost:${config.port}  (${config.isProd ? "production" : "dev"})`,
    );
    console.log(`  Storage:              ${storeKind}`);
    console.log(`  OAuth redirect_uri:   ${redirectUri}`);
    console.log(`  Webhook endpoint:     POST ${config.appBaseUrl}/webhooks\n`);
});

// Close the store's connection cleanly on shutdown (a no-op for the in-memory store).
for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
        server.close();
        store.close().finally(() => process.exit(0));
    });
}
