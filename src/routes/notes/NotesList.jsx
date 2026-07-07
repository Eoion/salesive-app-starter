import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { timeAgo, toPlainText } from "../../lib/format.js";
import { Button, Input, PageHeader, cx } from "../../components/ui.jsx";
import { AvatarStack } from "../../components/Avatar.jsx";
import { RefreshIcon } from "../../components/icons.jsx";
import {
    EmptyState,
    ErrorState,
    InlineLoading,
} from "../../components/States.jsx";

// The store's Salesive notes — anything created here shows up in the Salesive
// dashboard's own Notes, and vice versa. Rendered as the persistent left pane of
// the master-detail layout (see NotesShell), so it's presentational: the data,
// refetch, and which note is open (`selectedId`) are all owned by the shell.
//
// The notes endpoint returns EVERY note for the store, newest first, as a flat
// array (no server-side pagination or search), so we search/filter client-side.
export default function NotesList({
    notes = [],
    loading,
    error,
    refetch,
    selectedId,
}) {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");

    const q = query.trim().toLowerCase();
    const filtered = q
        ? notes.filter(
              (n) =>
                  (n.title || "").toLowerCase().includes(q) ||
                  (n.body || "").toLowerCase().includes(q),
          )
        : notes;

    return (
        <>
            <PageHeader
                title="Notes"
                subtitle="Your store's notes, synced with Salesive."
                actions={
                    <>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={loading && notes.length > 0}
                            onClick={refetch}
                        >
                            <RefreshIcon
                                className={cx(
                                    "h-3.5 w-3.5",
                                    loading &&
                                        notes.length > 0 &&
                                        "animate-spin",
                                )}
                            />
                            Refresh
                        </Button>
                        <Button size="sm" to="/notes/new">
                            New note
                        </Button>
                    </>
                }
            />

            <div className="mb-4">
                <Input
                    className="max-w-xs"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search notes…"
                    aria-label="Search notes"
                />
            </div>

            {loading && !notes.length ? (
                <InlineLoading label="Loading notes…" />
            ) : error && !notes.length ? (
                <ErrorState error={error} onRetry={refetch} />
            ) : filtered.length === 0 ? (
                <EmptyState
                    title={q ? "No notes match your search" : "No notes yet"}
                    message={
                        q
                            ? "Try a different search term."
                            : "Create your first note — it'll sync to your store's Salesive notes."
                    }
                    action={
                        !q && (
                            <Button to="/notes/new" size="sm">
                                New note
                            </Button>
                        )
                    }
                />
            ) : (
                <ul className="space-y-2">
                    {filtered.map((n) => {
                        const snippet = toPlainText(n.body);
                        const active = n._id === selectedId;
                        return (
                            <li key={n._id}>
                                <button
                                    onClick={() => navigate(`/notes/${n._id}`)}
                                    aria-current={active ? "true" : undefined}
                                    className={cx(
                                        "block w-full rounded-xl border px-4 py-3.5 text-left transition-colors",
                                        active
                                            ? "border-wood-400 bg-wood-100"
                                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="truncate font-medium text-gray-900">
                                            {n.title || "Untitled"}
                                        </h3>
                                        <span className="shrink-0 text-xs text-gray-400">
                                            {timeAgo(
                                                n.updatedAt || n.createdAt,
                                            )}
                                        </span>
                                    </div>
                                    {snippet && (
                                        <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                                            {snippet}
                                        </p>
                                    )}
                                    {n.readBy?.length > 0 && (
                                        <div className="mt-2.5 flex items-center gap-1.5">
                                            <span className="text-[11px] text-gray-400">
                                                Read by
                                            </span>
                                            <AvatarStack
                                                users={n.readBy}
                                                size="h-5 w-5"
                                            />
                                        </div>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </>
    );
}
