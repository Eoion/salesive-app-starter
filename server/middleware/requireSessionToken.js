import { bearerFrom, verifySessionToken } from "../sessionToken.js";

// Gate for routes called by your front end while it runs inside the Salesive
// dashboard. The front end sends `Authorization: Bearer <getSessionToken()>`;
// this verifies it (server/sessionToken.js) and sets:
//
//   req.shop          the store id, from the token's `dest` claim
//   req.salesiveUser  { id, role } of the signed in Salesive user
//   req.sessionToken  every verified claim
//
// It is the cookie free alternative to requireShop: nothing rides along
// automatically, so there is no CSRF exposure and no third party cookie to lose.
// The token proves who is calling; it does not prove the app is still installed
// in your own store, so check that where it matters (see /api/session).
export async function requireSessionToken(req, res, next) {
    const token = bearerFrom(req);
    if (!token) {
        return res.status(401).json({ success: false, message: "Missing session token" });
    }
    try {
        const claims = await verifySessionToken(token);
        req.shop = String(claims.dest);
        req.salesiveUser = { id: String(claims.sub), role: claims.role || null };
        req.sessionToken = claims;
        next();
    } catch (err) {
        if (err?.name === "SessionTokenError") {
            return res.status(401).json({ success: false, message: err.message });
        }
        next(err);
    }
}
