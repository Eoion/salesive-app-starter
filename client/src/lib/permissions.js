/**
 * Salesive App Bridge — runtime permission & lifecycle helpers.
 *
 * This used to be a vendored copy of the bridge. It is now a re-export of the
 * hardened implementation in the `salesive-dev-tools` package, which every app
 * should do too: one import replaces the copy, and bridge fixes reach your app
 * with an `npm update` instead of a hand-mirrored file.
 *
 * The SDK version is safe by default where the old copy was not: it resolves
 * the dashboard origin (from the referrer, or pinned via initBridge) and drops
 * every message that does not come from exactly that origin and the parent
 * window. It never posts to a wildcard target.
 *
 * Usage
 * -----
 * import { requestPermission, getGrantedPermissions, onAppOpened, onAppMinimized, onLaunch } from "@/lib/permissions";
 *
 * // Check what's already granted on mount (no modal):
 * const grants = await getGrantedPermissions();
 * const hasAutoLaunch = "AUTO_LAUNCH" in grants;
 *
 * // Request a permission if not yet granted:
 * if (!hasAutoLaunch) {
 *   const granted = await requestPermission("AUTO_LAUNCH", "recurring");
 * }
 *
 * // Listen for lifecycle events:
 * onAppMinimized(() => { startMyTimer(); });
 * onAppOpened(() => { clearMyTimer(); });
 *
 * // Ask the dashboard to expand the app (AUTO_LAUNCH grant required):
 * onLaunch();
 *
 * // Prove to your own backend which store and user is calling:
 * const token = await getSessionToken();
 * fetch("/api/session", { headers: { Authorization: `Bearer ${token}` } });
 */

export {
    initBridge,
    setDashboardOrigin,
    getDashboardOrigin,
    requestPermission,
    getGrantedPermissions,
    getSessionToken,
    SessionTokenError,
    pickFiles,
    onLaunch,
    onAppWake,
    onAppOpened,
    onAppMinimized,
    onAppClosed,
    onLogout,
    onStoreChanged,
    onEvent,
    isExtension,
    getExtensionContext,
    onExtensionContext,
    resizeExtension,
    autoResizeExtension,
    closeExtension,
    PERMISSIONS,
    DURATIONS,
    APP_EVENTS,
} from "salesive-dev-tools/permissions";
