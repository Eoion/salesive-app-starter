import { config } from "./config.js";

// ── Store: installs + pending OAuth states ──────────────────────────────────────
//
// Two interchangeable backends behind ONE async interface:
//
//   • in-memory (default) — zero setup, but loses everything on restart and can't
//     be shared across processes. Perfect for trying the sample.
//   • MongoDB — set MONGODB_URI to persist installs across restarts and share them
//     between processes. Selected automatically when MONGODB_URI is set.
//
// initStore() (called once at startup) picks the backend; if MongoDB is configured
// but unreachable, it warns and falls back to memory so the app still runs. Swapping
// in Postgres/Redis/etc. is just another object with these six methods.
//
// SECURITY: an installation record holds the store-scoped app token — a secret.
// This sample stores it as-is for clarity; encrypt it at rest before production.

const PENDING_TTL_MS = 10 * 60 * 1000; // matches the auth-code TTL

// ── In-memory backend ───────────────────────────────────────────────────────
function createMemoryStore() {
    const installs = new Map(); // shopId -> installation
    const pending = new Map(); // oauth state -> { shop, codeVerifier, createdAt }

    // Evict abandoned OAuth states so the Map can't grow without bound — the
    // unauthenticated GET /oauth/start creates one on every visit. Mirrors the
    // Mongo TTL index's ~60s cadence; takePending still enforces the exact cutoff.
    // unref() so this timer never keeps the process alive on its own.
    const sweep = setInterval(() => {
        const now = Date.now();
        for (const [k, v] of pending) {
            if (now - v.createdAt > PENDING_TTL_MS) pending.delete(k);
        }
    }, 60_000);
    sweep.unref();

    return {
        kind: "in-memory",
        async putPending(state, data) {
            pending.set(String(state), { ...data, createdAt: Date.now() });
        },
        async takePending(state) {
            const key = String(state);
            const v = pending.get(key);
            pending.delete(key);
            if (!v) return null;
            if (Date.now() - v.createdAt > PENDING_TTL_MS) return null;
            return v;
        },
        async saveInstallation(shop, data) {
            installs.set(String(shop), { shop: String(shop), ...data });
        },
        async getInstallation(shop) {
            return installs.get(String(shop)) || null;
        },
        async removeInstallation(shop) {
            installs.delete(String(shop));
        },
        async isInstalled(shop) {
            return installs.has(String(shop));
        },
        async close() {
            clearInterval(sweep);
        },
    };
}

// ── MongoDB backend ─────────────────────────────────────────────────────────
async function createMongoStore(uri) {
    // Imported lazily so the sample still runs (in-memory) even if the `mongodb`
    // package isn't installed or MONGODB_URI is unset.
    const { MongoClient } = await import("mongodb");
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
    await client.connect();

    // Everything after connect() must close the client on failure, or a
    // post-connect error (e.g. an index conflict) leaks the connection pool while
    // initStore falls back to memory.
    try {
        const db = client.db(); // database name comes from the URI path
        const installs = db.collection("installations");
        const pending = db.collection("pending_installs");
        // Abandoned OAuth states self-destruct ~10 min after creation (Mongo's TTL
        // sweep runs ~every 60s, so takePending still enforces the exact cutoff).
        await pending.createIndex({ createdAt: 1 }, { expireAfterSeconds: 600 });

        return {
            kind: "mongodb",
            async putPending(state, data) {
                await pending.updateOne(
                    { _id: String(state) },
                    { $set: { ...data, createdAt: new Date() } },
                    { upsert: true },
                );
            },
            async takePending(state) {
                const v = await pending.findOneAndDelete({ _id: String(state) });
                if (!v) return null;
                if (Date.now() - new Date(v.createdAt).getTime() > PENDING_TTL_MS) {
                    return null;
                }
                return v;
            },
            async saveInstallation(shop, data) {
                const _id = String(shop);
                // replaceOne (not $set) so the record is fully rewritten every
                // call — same semantics as the in-memory backend's Map.set.
                await installs.replaceOne(
                    { _id },
                    { shop: _id, ...data },
                    { upsert: true },
                );
            },
            async getInstallation(shop) {
                return installs.findOne({ _id: String(shop) });
            },
            async removeInstallation(shop) {
                await installs.deleteOne({ _id: String(shop) });
            },
            async isInstalled(shop) {
                const n = await installs.countDocuments(
                    { _id: String(shop) },
                    { limit: 1 },
                );
                return n > 0;
            },
            async close() {
                await client.close();
            },
        };
    } catch (err) {
        await client.close().catch(() => {});
        throw err;
    }
}

// ── Facade ──────────────────────────────────────────────────────────────────
// `store` delegates to whichever backend initStore() selects. It defaults to an
// in-memory backend so imports work before initStore() runs (e.g. in tests).
let backend = createMemoryStore();

// Pick the backend. Never throws: a MongoDB misconfiguration degrades to memory so
// the sample always boots. Returns a human label for the startup banner.
export async function initStore() {
    if (config.mongoUri) {
        try {
            backend = await createMongoStore(config.mongoUri);
            return "mongodb";
        } catch (err) {
            console.warn(
                `\n  [store] MongoDB init failed (${err.message}).` +
                    `\n  Falling back to in-memory — installs will NOT persist across restarts.\n`,
            );
        }
    }
    backend = createMemoryStore();
    return config.mongoUri ? "in-memory (MongoDB fallback)" : "in-memory";
}

export const store = {
    putPending: (...a) => backend.putPending(...a),
    takePending: (...a) => backend.takePending(...a),
    saveInstallation: (...a) => backend.saveInstallation(...a),
    getInstallation: (...a) => backend.getInstallation(...a),
    removeInstallation: (...a) => backend.removeInstallation(...a),
    isInstalled: (...a) => backend.isInstalled(...a),
    close: () => backend.close(),
};
