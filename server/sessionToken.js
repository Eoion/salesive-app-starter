import crypto from "crypto";
import { config } from "./config.js";

// ── Salesive session tokens ─────────────────────────────────────────────────────
//
// Inside the dashboard your front end calls getSessionToken() (client/src/lib/
// permissions.js) and sends the result as `Authorization: Bearer <token>`. It is a
// 60 second JWT, signed ES256 by Salesive, that says which store (`dest`) and which
// signed in user (`sub`) is using your app right now. Unlike ?shop= in the launch
// URL, nobody can forge it.
//
// verifySessionToken() below checks it with Salesive's public key, published at
// <SALESIVE_API_BASE>/api/v1/oauth/jwks. No dependency: Node's crypto does ES256.
//
// The checks, every one of them required:
//   alg     must be ES256 (never let a token pick how it is verified)
//   kid     must name a key in the JWKS; the signature must verify with it
//   aud     must be YOUR client id. Salesive signs tokens for every app with the same
//           key, so without this check another app's token would be accepted.
//   iss     must be the Salesive API you talk to
//   exp/nbf with a few seconds of clock tolerance
//   purpose "session" by default (other Salesive tokens for your app are refused).
//           If you add an MCP server for Ola, verify its bearer tokens with
//           verifySessionToken(token, { purpose: "mcp" }): same key, same claims.

const LEEWAY_SECONDS = 5;
const JWKS_TTL_MS = 60 * 60 * 1000;

export class SessionTokenError extends Error {
    constructor(reason) {
        super(`Invalid session token: ${reason}`);
        this.name = "SessionTokenError";
        this.reason = reason;
    }
}

// JWKS cache. Refetched hourly, and at most once a minute when a token names an
// unknown kid (Salesive rotated its key).
let jwksCache = { keys: new Map(), fetchedAt: 0 };
let fetchJwksImpl = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`JWKS fetch failed (${res.status})`);
    return res.json();
};

/** Tests only: swap the JWKS fetcher and drop the cache. */
export function __setJwksFetcher(fn) {
    fetchJwksImpl = fn;
    jwksCache = { keys: new Map(), fetchedAt: 0 };
}

async function loadJwks() {
    const data = await fetchJwksImpl(`${config.apiBase}/api/v1/oauth/jwks`);
    const keys = new Map();
    for (const jwk of data?.keys || []) {
        if (jwk.kty !== "EC" || jwk.crv !== "P-256" || !jwk.kid) continue;
        keys.set(jwk.kid, crypto.createPublicKey({ key: { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y }, format: "jwk" }));
    }
    jwksCache = { keys, fetchedAt: Date.now() };
}

async function publicKeyFor(kid) {
    const age = Date.now() - jwksCache.fetchedAt;
    if (!jwksCache.keys.size || age > JWKS_TTL_MS) await loadJwks();
    let key = jwksCache.keys.get(kid);
    if (!key && Date.now() - jwksCache.fetchedAt > 60_000) {
        await loadJwks();
        key = jwksCache.keys.get(kid);
    }
    return key || null;
}

const decodePart = (part) => {
    try {
        return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
    } catch {
        return null;
    }
};

/**
 * Verify a Salesive session token. Resolves with its claims, or throws
 * SessionTokenError. `dest` is the store id, `sub` the user id, `role` is
 * "owner" or "staff", `installation` the installation id.
 */
export async function verifySessionToken(
    token,
    { clientId = config.clientId, issuer = config.apiBase, purpose = "session", now = Date.now() } = {},
) {
    if (!clientId) throw new SessionTokenError("SALESIVE_CLIENT_ID is not set");
    const parts = typeof token === "string" ? token.split(".") : [];
    if (parts.length !== 3) throw new SessionTokenError("malformed");
    const [h, p, s] = parts;
    const header = decodePart(h);
    const claims = decodePart(p);
    if (!header || !claims) throw new SessionTokenError("malformed");
    if (header.alg !== "ES256") throw new SessionTokenError("unexpected alg");

    const key = await publicKeyFor(header.kid);
    if (!key) throw new SessionTokenError("unknown key");
    const ok = crypto.verify(
        "sha256",
        Buffer.from(`${h}.${p}`),
        { key, dsaEncoding: "ieee-p1363" },
        Buffer.from(s, "base64url"),
    );
    if (!ok) throw new SessionTokenError("bad signature");

    const nowSec = Math.floor(now / 1000);
    if (claims.aud !== clientId) throw new SessionTokenError("wrong audience");
    if (claims.iss !== issuer) throw new SessionTokenError("wrong issuer");
    if (typeof claims.exp !== "number" || nowSec > claims.exp + LEEWAY_SECONDS) {
        throw new SessionTokenError("expired");
    }
    if (typeof claims.nbf === "number" && nowSec + LEEWAY_SECONDS < claims.nbf) {
        throw new SessionTokenError("not yet valid");
    }
    // Salesive signs other tokens for your app too (purpose "mcp" for Ola's calls to
    // your MCP server). Each route accepts only the purpose it expects, so an MCP token
    // is refused on session routes and a session token on an MCP server.
    if (!purpose || claims.purpose !== purpose) throw new SessionTokenError("wrong purpose");
    if (!claims.dest || !claims.sub) throw new SessionTokenError("missing claims");
    return claims;
}

/** Pull a bearer token off a request, or null. */
export function bearerFrom(req) {
    const header = req.headers?.authorization || "";
    return header.startsWith("Bearer ") ? header.slice(7).trim() : null;
}
