// Salesive WebMCP bridge for your app.
// Register tools that Ola — the merchant's AI assistant in the Salesive
// dashboard — can call after the merchant approves each request.
//
// This used to be a vendored copy of the salesive-dev-tools webmcp module. It
// is now a re-export of the hardened implementation in that package, and your
// app should do the same: the SDK version only accepts tool calls from the
// dashboard origin (referrer-resolved, or pinned via configureWebMCP) and from
// the parent window, where the old copy answered any framing page. Bridge fixes
// reach your app with an `npm update` instead of a hand-mirrored file.
//
// Works in every browser: the SDK bridge IS the implementation; no native
// navigator.modelContext support is needed. If the browser does ship one,
// registrations are mirrored into it too.

export {
    configureWebMCP,
    setWebMCPDashboardOrigin,
    getWebMCPDashboardOrigin,
    installWebMCP,
    modelContext,
} from "salesive-dev-tools/webmcp";
