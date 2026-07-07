import { Outlet, useLocation, useMatch } from "react-router-dom";
import { apiGet } from "../../lib/api.js";
import { useAsync, useVisibilityRefetch } from "../../lib/hooks.js";
import { useWebhook, webhookResource } from "../../lib/socket.jsx";
import { Button, cx } from "../../components/ui.jsx";
import { NoteIcon } from "../../components/icons.jsx";
import NotesList from "./NotesList.jsx";

// Master-detail shell for the notes section.
//
//   • On PC (md+) the list is a persistent left pane and the opened note (or the
//     create form, or an empty-state) renders beside it on the right.
//   • On phones it collapses to one pane at a time: the list at "/", and the
//     detail/create view on its own route — matching the previous behaviour.
//
// The list's data lives HERE, not in <NotesList>, so it survives navigation
// between notes (no refetch/flicker on every click) and can be refreshed after a
// create/edit/delete — children get `refreshNotes` via the <Outlet> context.
export default function NotesShell() {
    const { data, loading, error, refetch } = useAsync(() => apiGet("/notes"), []);
    const notes = Array.isArray(data) ? data : [];

    // Freshness for a resource without a guaranteed push: refetch on tab focus and
    // when a "notes" webhook arrives.
    useVisibilityRefetch(refetch);
    useWebhook(
        (payload) => {
            if (webhookResource(payload) === "notes") refetch();
        },
        [refetch],
    );

    // Which pane is "active" on a phone, and which note (if any) is open.
    const atList = useLocation().pathname === "/";
    const detail = useMatch("/notes/:id");
    const selectedId =
        detail && detail.params.id !== "new" ? detail.params.id : null;

    // Fill the content area (flex-1 of Layout's <main>) and let each pane scroll on
    // its own (min-h-0 + overflow-y-auto) so the page itself never scrolls. On PC a
    // two-column grid whose single row (grid-rows-1 = minmax(0,1fr)) fills the height.
    return (
        <div className="flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[18rem_minmax(0,1fr)] md:grid-rows-1 md:gap-6">
            <aside
                className={cx(
                    atList ? "block" : "hidden",
                    "h-full min-h-0 overflow-y-auto md:block md:pr-1",
                )}
            >
                <NotesList
                    notes={notes}
                    loading={loading}
                    error={error}
                    refetch={refetch}
                    selectedId={selectedId}
                />
            </aside>

            <section
                className={cx(
                    atList ? "hidden" : "block",
                    "h-full min-h-0 overflow-y-auto md:block",
                )}
            >
                <Outlet context={{ refreshNotes: refetch }} />
            </section>
        </div>
    );
}

// Right-pane placeholder shown on PC when no note is open (the "/" index). Hidden
// on phones, where "/" already shows the list in the single pane.
export function NotesEmpty() {
    return (
        <div className="hidden h-full min-h-[16rem] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white/50 p-8 text-center md:flex">
            <NoteIcon className="h-8 w-8 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-600">
                No note selected
            </p>
            <p className="mt-1 text-xs text-gray-400">
                Pick a note from the list, or start a new one.
            </p>
            <div className="mt-4">
                <Button size="sm" to="/notes/new">
                    New note
                </Button>
            </div>
        </div>
    );
}
