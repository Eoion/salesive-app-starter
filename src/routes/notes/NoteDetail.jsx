import { useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { apiGet, apiPut, apiDelete } from "../../lib/api.js";
import { useAsync } from "../../lib/hooks.js";
import { formatDateTime } from "../../lib/format.js";
import { Button } from "../../components/ui.jsx";
import { ErrorState, InlineLoading } from "../../components/States.jsx";
import { BackIcon } from "../../components/icons.jsx";
import Confirm from "../../components/Confirm.jsx";
import { useToast } from "../../components/Toast.jsx";
import NoteForm from "./NoteForm.jsx";

// Note detail — open a note and edit it in place (title + rich body), like a
// modern notes app. Delete lives in the slim top bar; metadata sits underneath.
export default function NoteDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    // Provided by NotesShell — keep the (persistent) list pane in sync on edit/delete.
    const { refreshNotes } = useOutletContext();

    const { data: note, loading, error, refetch } = useAsync(
        () => apiGet(`/notes/${id}`),
        [id],
    );

    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Show the loader whenever the loaded note doesn't match the URL — on first
    // load AND while navigating between notes (useAsync keeps the previous note's
    // data during the new fetch). Without the id check we'd briefly render the old
    // note under the new URL, and a save in that window would write to the wrong id.
    if (loading && note?._id !== id) return <InlineLoading label="Loading note…" />;
    if (error && !note) return <ErrorState error={error} onRetry={refetch} />;
    if (!note) return null;

    async function save(body) {
        setSaving(true);
        try {
            await apiPut(`/notes/${id}`, body);
            toast.success("Note updated.");
            refetch();
            refreshNotes();
        } catch (err) {
            toast.error(err.message || "Could not update the note.");
        } finally {
            setSaving(false);
        }
    }

    async function remove() {
        setDeleting(true);
        try {
            await apiDelete(`/notes/${id}`);
            toast.success("Note deleted.");
            refreshNotes();
            navigate("/");
        } catch (err) {
            toast.error(err.message || "Could not delete the note.");
            setDeleting(false);
            setConfirmDelete(false);
        }
    }

    const author = note.user?.name || note.user?.email || null;

    return (
        <>
            <div className="mb-5 flex items-center justify-between gap-3">
                {/* Back to the list — phones only; on PC the list is beside this pane. */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-1 text-xs font-medium leading-none text-gray-500 hover:text-gray-700 md:hidden"
                >
                    <BackIcon className="h-3.5 w-3.5 shrink-0" />
                    Notes
                </Link>
                <div className="flex items-center gap-3 md:ml-auto">
                    <span className="hidden text-xs text-gray-400 sm:inline">
                        Updated {formatDateTime(note.updatedAt)}
                    </span>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setConfirmDelete(true)}
                    >
                        Delete
                    </Button>
                </div>
            </div>

            {/* Key on the note id only — remount when you switch notes, but NOT on
                every save/refetch, which would discard edits typed while a save is
                in flight (the editor seeds from `initial` once per mount). */}
            <NoteForm
                key={note._id}
                initial={note}
                submitting={saving}
                submitLabel="Save changes"
                onSubmit={save}
            />

            <p className="mt-4 px-1 text-xs text-gray-400">
                Created {formatDateTime(note.createdAt)}
                {author ? ` · by ${author}` : ""}
            </p>

            <Confirm
                open={confirmDelete}
                title="Delete this note?"
                message="This permanently removes the note from your store. This can't be undone."
                confirmLabel="Delete"
                busy={deleting}
                onConfirm={remove}
                onCancel={() => setConfirmDelete(false)}
            />
        </>
    );
}
