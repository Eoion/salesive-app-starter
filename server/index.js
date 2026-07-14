import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server as IOServer } from "socket.io";
import { config, redirectUri, warnMissingConfig } from "./config.js";
import { createApp } from "./app.js";
import { store, initStore } from "./store.js";
import { attachSockets } from "./sockets.js";
import { serveFrontend } from "./frontend.js";
import { errorHandler } from "./middleware/errors.js";

// Entry point for a LONG-LIVED Node process — local dev and any always-on host
// (Pxxl, Render, Fly, a VM). The whole app runs on one port: API, OAuth, webhooks,
// socket.io and the front end.
//
// Deploying to Vercel instead? That uses api/index.js, which is serverless: no
// socket.io (the UI polls) and the front end is served by the CDN. See vercel.json
// and the "Deploying" section of the README.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

warnMissingConfig();

// socket.io needs the HTTP server and the app needs `io`, so the server is created
// without a request handler and the app is attached once both exist.
const server = http.createServer();
// Same-origin (the front end is served from this very server, even when embedded
// in the dashboard iframe), so socket.io needs no CORS config.
const io = new IOServer(server);
attachSockets(io);

const app = createApp({ io });
server.on("request", app);

// Front end — Vite middleware in dev, built dist + SPA fallback in prod. Mounted
// after the backend routes (inside createApp) so it only handles non-backend paths.
await serveFrontend(app, { root, server, isProd: config.isProd });

// Error backstop — last, so it can catch errors from any layer above.
app.use(errorHandler);

// Pick the storage backend before accepting traffic (in-memory by default, MongoDB
// when MONGODB_URI is set). Never fatal here — a MongoDB misconfig degrades to memory.
const storeKind = await initStore();

server.listen(config.port, () => {
    console.log(
        `\n  Salesive app starter → http://localhost:${config.port}  (${config.isProd ? "production" : "dev"})`,
    );
    console.log(`  Storage:              ${storeKind}`);
    console.log(`  Realtime:             ${config.realtime} (socket.io)`);
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
