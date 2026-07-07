import { useState } from "react";
import { Button } from "../../components/ui.jsx";
import NoteEditor from "../../components/NoteEditor.jsx";
import { toPlainText } from "../../lib/format.js";

// Create/edit form for a note — a big borderless title and the WYSIWYG body
// editor (TipTap, same as the Salesive dashboard). The parent owns the request +
// busy state. The body is stored as HTML; Markdown shortcuts still work while
// typing (**bold**, `# heading`, `- list`).
export default function NoteForm({
    initial,
    submitting,
    submitLabel = "Save",
    onSubmit,
    onCancel,
}) {
    const [form, setForm] = useState(() => ({
        title: initial?.title || "",
        body: initial?.body || "",
    }));

    const title = form.title.trim();
    // The editor emits HTML ("<p></p>" when empty), so measure emptiness by text.
    const hasBody = toPlainText(form.body).trim().length > 0;
    const canSubmit = title.length > 0 && hasBody;

    function submit(e) {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({ title, body: form.body });
    }

    return (
        <form onSubmit={submit} className="space-y-4">
            <input
                className="w-full border-0 bg-transparent px-1 font-serif text-2xl font-bold text-gray-900 placeholder:font-sans placeholder:font-normal placeholder:text-gray-300 focus:outline-none"
                placeholder="Title"
                value={form.title}
                onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                }
                maxLength={200}
                autoFocus={!initial}
                aria-label="Note title"
            />

            <NoteEditor
                initialValue={initial?.body || ""}
                onChange={(html) => setForm((f) => ({ ...f, body: html }))}
                placeholder="Start writing…"
            />

            <div className="flex justify-end gap-2 pt-1">
                {onCancel && (
                    <Button
                        variant="secondary"
                        onClick={onCancel}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                )}
                <Button type="submit" loading={submitting} disabled={!canSubmit}>
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}
