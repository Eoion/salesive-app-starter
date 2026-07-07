import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useShop } from "../lib/shop.jsx";
import { apiGet } from "../lib/api.js";
import { useAsync } from "../lib/hooks.js";
import { LogoutIcon } from "./icons.jsx";

// App shell for the installed experience. A slim top strip carries the current
// Salesive user (avatar + name, from the default-granted /app/context endpoint —
// no scope needed) and a log-out button. The <Outlet/> below is where the matched
// note route renders.
export default function Layout() {
    const { logout } = useShop();

    // Default grant — store & user context. We only surface the user here.
    const { data: ctx } = useAsync(() => apiGet("/context"), []);
    const user = ctx?.user || null;

    return (
        // Fill the iframe exactly (h-screen) and clip, so the PAGE never scrolls —
        // the top strip is fixed height and the content area below scrolls its own
        // panes instead (see NotesShell).
        <div className="parchment flex h-screen flex-col overflow-hidden text-gray-900">
            <div className="mx-auto flex w-full max-w-3xl shrink-0 items-center justify-between gap-3 px-5 py-2">
                <UserBadge user={user} />

                <button
                    type="button"
                    onClick={logout}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                >
                    <LogoutIcon />
                    Log out
                </button>
            </div>

            <main className="mx-auto flex w-full min-h-0 max-w-3xl flex-1 flex-col px-5 pb-4 pt-1">
                <Outlet />
            </main>
        </div>
    );
}

// The signed-in Salesive user: avatar + name. Falls back to an initial while the
// context loads or if the avatar is missing / fails to load.
function UserBadge({ user }) {
    const [broken, setBroken] = useState(false);

    if (!user) {
        return (
            <span className="flex items-center gap-2">
                <span className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-gray-200" />
                <span className="h-3 w-24 animate-pulse rounded bg-gray-200" />
            </span>
        );
    }

    const name = user.name || "You";
    const initial = (name.trim()[0] || "?").toUpperCase();

    return (
        <span className="flex min-w-0 items-center gap-2">
            {user.avatar && !broken ? (
                <img
                    src={user.avatar}
                    alt=""
                    onError={() => setBroken(true)}
                    className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-black/5"
                />
            ) : (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-wood-600 text-[11px] font-semibold text-white">
                    {initial}
                </span>
            )}
            <span className="truncate text-sm font-medium text-gray-800">
                {name}
            </span>
        </span>
    );
}
