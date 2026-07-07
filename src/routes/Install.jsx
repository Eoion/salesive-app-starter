import { Navigate, useLocation } from "react-router-dom";
import { useShop } from "../lib/shop.jsx";
import { getLaunchName } from "../lib/api.js";
import { Loading, NoShop } from "../components/States.jsx";
import { NoteIcon } from "../components/icons.jsx";

// Client route: /install — the entry / splash screen shown before install.
//
// The button is a plain <a>, NOT a react-router <Link>: installing leaves this
// origin for Salesive's consent screen, so it must be a real browser navigation.
// We lead with the merchant's own store NAME (from the launch URL's ?name=) — the
// store logo isn't fetchable until after install (it comes from the app-token
// /app/context endpoint), so it appears in the app header once installed. No
// permissions are surfaced here; they're reviewed on Salesive's consent screen.
export default function Install() {
    const { launchShop, me, loading, authenticated } = useShop();
    const location = useLocation();

    if (loading || !me) return <Loading />;
    // Already authenticated → send them to the app (preserve ?shop= in the URL).
    if (authenticated) return <Navigate to={`/${location.search}`} replace />;
    // No store to install for (opened outside the dashboard).
    if (!launchShop) return <NoShop />;

    const storeName = getLaunchName();

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-wood-50 via-white to-wood-50">
            {/* Warm wood-tinted glow for depth. */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-wood-200/45 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 right-0 h-64 w-64 translate-x-1/4 rounded-full bg-wood-100/70 blur-3xl" />

            <div className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
                {/* Wood-grain app icon */}
                <div
                    className="animate-splash relative mb-7"
                    style={{ animationDelay: "0ms" }}
                >
                    <div className="absolute inset-0 -z-10 rounded-[30px] bg-wood-600/25 blur-2xl" />
                    <div className="wood-grain flex h-24 w-24 items-center justify-center rounded-[26px] text-white shadow-xl shadow-wood-800/30 ring-1 ring-black/10">
                        <NoteIcon className="h-11 w-11 drop-shadow" />
                    </div>
                </div>

                {/* App eyebrow */}
                <p
                    className="animate-splash text-[11px] font-semibold uppercase tracking-[0.18em] text-wood-700"
                    style={{ animationDelay: "80ms" }}
                >
                    Salesive Notes
                </p>

                {/* Store name — the merchant's own store */}
                <h1
                    className="animate-splash mt-2 max-w-sm font-serif text-3xl font-bold tracking-tight text-wood-900"
                    style={{ animationDelay: "140ms" }}
                >
                    {storeName || "Your store"}
                </h1>

                {/* Tagline */}
                <p
                    className="animate-splash mt-3 max-w-xs text-sm leading-relaxed text-wood-800/70"
                    style={{ animationDelay: "200ms" }}
                >
                    Create and sync notes with your store — right inside Salesive.
                </p>

                {/* CTA */}
                <a
                    href={me.installUrl}
                    className="animate-splash group mt-8 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-wood-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-wood-800/25 transition-all hover:bg-wood-800 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-wood-700/40 focus:ring-offset-2"
                    style={{ animationDelay: "270ms" }}
                >
                    Get started
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5"
                    >
                        <path
                            d="M5 12h14M13 6l6 6-6 6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </a>

                {/* Footer */}
                <p
                    className="animate-splash mt-6 text-xs text-wood-800/50"
                    style={{ animationDelay: "330ms" }}
                >
                    Secured by Salesive
                </p>
            </div>
        </div>
    );
}
