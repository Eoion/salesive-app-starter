// Full-screen states shared by the routes and the install guard, plus inline
// states (loading / error / empty) used by the CRUD pages inside the app shell.
import { Button, Spinner } from "./ui.jsx";

export function Centered({ children }) {
    return (
        <div className="parchment flex min-h-screen items-center justify-center px-5">
            {children}
        </div>
    );
}

// Shown until GET /api/me resolves.
export function Loading() {
    return (
        <Centered>
            <p className="text-sm text-gray-500">Loading…</p>
        </Centered>
    );
}

// Shown when there's no ?shop= in the URL — the app must be opened from Salesive.
export function NoShop() {
    return (
        <Centered>
            <p className="max-w-sm text-center text-sm text-gray-600">
                Open this app from your Salesive dashboard — it appends a{" "}
                <code className="font-mono">shop</code> to the URL so the app knows
                which store it's running for.
            </p>
        </Centered>
    );
}

// ── Inline states (render inside the app shell, not full-screen) ───────────────

export function InlineLoading({ label = "Loading…" }) {
    return (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
            <Spinner className="h-4 w-4" />
            {label}
        </div>
    );
}

// Generic error panel with an optional retry. Pass the caught Error (or its
// message). Used by every data page so failures never render a blank screen.
export function ErrorState({ error, onRetry }) {
    const message =
        (error && (error.message || String(error))) || "Something went wrong.";
    return (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-8 text-center">
            <p className="text-sm font-medium text-red-700">{message}</p>
            {onRetry && (
                <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={onRetry}
                >
                    Try again
                </Button>
            )}
        </div>
    );
}

// Empty-list placeholder with an optional call to action.
export function EmptyState({ title, message, action }) {
    return (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-12 text-center">
            <p className="text-sm font-medium text-gray-700">{title}</p>
            {message && <p className="mt-1 text-sm text-gray-400">{message}</p>}
            {action && <div className="mt-4 flex justify-center">{action}</div>}
        </div>
    );
}
