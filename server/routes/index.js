import oauthRouter from "./oauth.js";
import apiRouter from "./api.js";
import notesRouter from "./notes.js";
import webhookRouter from "./webhooks.js";
import { notFound } from "../middleware/notFound.js";

// Register all BACKEND routes under clear prefixes. Called from server/index.js
// BEFORE the front end is mounted, so these take precedence over the SPA catch-all.
//
//   POST /webhooks            signed store events (raw body — see server/index.js)
//   GET  /oauth/start         begin OAuth 2.1 + PKCE install
//   GET  /oauth/callback      finish install (code → tokens)
//   GET  /api/me              install state + scopes for the front end
//   /api/notes                notes CRUD proxied to the Salesive Apps API, gated by
//                             requireShop (shop derived from the session cookie).
export function registerRoutes(app, { io }) {
    app.use("/webhooks", webhookRouter(io));
    app.use("/oauth", oauthRouter);
    app.use("/api", apiRouter);

    // Resource CRUD. Mounted on its own /api/* sub-prefix; the more general
    // apiRouter above owns /api/me + /api/context + /api/logout, so /api/notes falls through here.
    app.use("/api/notes", notesRouter);

    // Anything under a backend prefix that wasn't matched above is a genuine miss —
    // answer with a JSON 404 here rather than letting it fall through to the SPA
    // (which would return index.html and break a fetch() caller).
    app.use(["/api", "/oauth", "/webhooks"], notFound);
}
