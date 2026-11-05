// Run with: npm test  (node --test, no network, no database)
import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

process.env.SALESIVE_CLIENT_ID = "app_mine";
process.env.SALESIVE_API_BASE = "https://api.salesive.test";

const { verifySessionToken, __setJwksFetcher } = await import("../server/sessionToken.js");
const { requireSessionToken } = await import("../server/middleware/requireSessionToken.js");

// A stand in for Salesive: a P-256 key, its JWKS, and a signer shaped like the API's.
const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const KID = "test-kid";
const jwk = { ...publicKey.export({ format: "jwk" }), kid: KID, alg: "ES256", use: "sig" };
let jwksFetches = 0;
__setJwksFetcher(async (url) => {
    assert.equal(url, "https://api.salesive.test/api/v1/oauth/jwks");
    jwksFetches += 1;
    return { keys: [jwk] };
});

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const sign = (claims, { key = privateKey, kid = KID, alg = "ES256" } = {}) => {
    const input = `${b64({ alg, typ: "JWT", kid })}.${b64(claims)}`;
    const sig = crypto.sign("sha256", Buffer.from(input), { key, dsaEncoding: "ieee-p1363" });
    return `${input}.${sig.toString("base64url")}`;
};
const now = Math.floor(Date.now() / 1000);
const claims = (over = {}) => ({
    iss: "https://api.salesive.test",
    dest: "shop_1",
    aud: "app_mine",
    sub: "user_1",
    iat: now,
    nbf: now,
    exp: now + 60,
    jti: "j1",
    sid: "s1",
    installation: "inst_1",
    role: "staff",
    purpose: "session",
    ...over,
});

test("a valid token verifies and the JWKS is cached", async () => {
    const out = await verifySessionToken(sign(claims()));
    assert.equal(out.dest, "shop_1");
    await verifySessionToken(sign(claims()));
    assert.equal(jwksFetches, 1);
});

test("rejects another app's token (wrong audience)", async () => {
    await assert.rejects(verifySessionToken(sign(claims({ aud: "app_other" }))), /wrong audience/);
});

test("rejects expired, not yet valid, and wrong issuer tokens", async () => {
    await assert.rejects(verifySessionToken(sign(claims({ exp: now - 30 }))), /expired/);
    await assert.rejects(verifySessionToken(sign(claims({ nbf: now + 120 }))), /not yet valid/);
    await assert.rejects(verifySessionToken(sign(claims({ iss: "https://evil.test" }))), /wrong issuer/);
});

test("rejects a foreign key, a tampered body, alg none and HS256", async () => {
    const other = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" }).privateKey;
    await assert.rejects(verifySessionToken(sign(claims(), { key: other })), /bad signature/);
    const [h, , s] = sign(claims()).split(".");
    await assert.rejects(verifySessionToken(`${h}.${b64(claims({ dest: "shop_2" }))}.${s}`), /bad signature/);
    await assert.rejects(verifySessionToken(`${b64({ alg: "none", kid: KID })}.${b64(claims())}.`), /unexpected alg/);
    await assert.rejects(verifySessionToken(`${b64({ alg: "HS256", kid: KID })}.${b64(claims())}.x`), /unexpected alg/);
    await assert.rejects(verifySessionToken("not-a-jwt"), /malformed/);
});

test("a token for another purpose is refused", async () => {
    await assert.rejects(verifySessionToken(sign(claims({ purpose: "mcp" }))), /wrong purpose/);
    assert.equal((await verifySessionToken(sign(claims({ purpose: "session" })))).dest, "shop_1");
});

test("an MCP server verifies purpose mcp and refuses session tokens", async () => {
    const out = await verifySessionToken(sign(claims({ purpose: "mcp" })), { purpose: "mcp" });
    assert.equal(out.purpose, "mcp");
    await assert.rejects(verifySessionToken(sign(claims()), { purpose: "mcp" }), /wrong purpose/);
});

test("a token with no purpose is refused", async () => {
    const { purpose, ...rest } = claims();
    assert.equal(purpose, "session");
    await assert.rejects(verifySessionToken(sign(rest)), /wrong purpose/);
});

test("an unknown kid is refused", async () => {
    await assert.rejects(verifySessionToken(sign(claims(), { kid: "rotated" })), /unknown key/);
});

const run = async (headers) => {
    const req = { headers };
    const res = {
        statusCode: 200,
        body: null,
        status(c) { this.statusCode = c; return this; },
        json(b) { this.body = b; return this; },
    };
    let nextCalled = false;
    await requireSessionToken(req, res, () => { nextCalled = true; });
    return { req, res, nextCalled };
};

test("middleware sets req.shop from dest and the user from sub", async () => {
    const { req, nextCalled } = await run({ authorization: `Bearer ${sign(claims())}` });
    assert.equal(nextCalled, true);
    assert.equal(req.shop, "shop_1");
    assert.deepEqual(req.salesiveUser, { id: "user_1", role: "staff" });
});

test("middleware answers 401 with no token or a bad one", async () => {
    assert.equal((await run({})).res.statusCode, 401);
    const bad = await run({ authorization: `Bearer ${sign(claims({ aud: "app_other" }))}` });
    assert.equal(bad.res.statusCode, 401);
    assert.equal(bad.nextCalled, false);
});
