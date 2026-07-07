import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { apiPost } from "../../lib/api.js";
import { BackIcon } from "../../components/icons.jsx";
import { useToast } from "../../components/Toast.jsx";
import NoteForm from "./NoteForm.jsx";

// Create a note (route "/notes/new"). The new note is immediately visible in the
// Salesive dashboard's own Notes too.
export default function NoteCreate() {
    const navigate = useNavigate();
    const toast = useToast();
    // Provided by NotesShell — refresh the (persistent) list pane after creating.
    const { refreshNotes } = useOutletContext();
    const [saving, setSaving] = useState(false);

    async function create(body) {
        setSaving(true);
        try {
            const created = await apiPost("/notes", body);
            toast.success("Note created.");
            refreshNotes();
            navigate(created?._id ? `/notes/${created._id}` : "/");
        } catch (err) {
            toast.error(err.message || "Could not create the note.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            {/* Redundant on PC (the list sits beside this pane) — phones only. */}
            <div className="mb-5 md:hidden">
                <Link
                    to="/"
                    className="inline-flex items-center gap-1 text-xs font-medium leading-none text-gray-500 hover:text-gray-700"
                >
                    <BackIcon className="h-3.5 w-3.5 shrink-0" />
                    Notes
                </Link>
            </div>

            <NoteForm
                submitting={saving}
                submitLabel="Create note"
                onSubmit={create}
                onCancel={() => navigate("/")}
            />
        </>
    );
}
