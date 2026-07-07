import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { marked } from "marked";
import { cx } from "./ui.jsx";

// A WYSIWYG note editor — the same stack the Salesive dashboard uses (TipTap /
// ProseMirror). Note bodies may arrive as Markdown OR HTML (Salesive accepts
// both); `marked` renders markdown and passes raw HTML through, so either becomes
// HTML for the editor, and the editor emits HTML via getHTML() on every change.
//
// Uncontrolled by design: it seeds from `initialValue` once and reports changes
// through onChange. To edit a different note, remount it (the parent keys the
// form by note id) so it re-seeds cleanly without fighting the cursor.
function toHtml(body) {
    if (!body) return "";
    try {
        return marked.parse(String(body), { breaks: true });
    } catch {
        return String(body);
    }
}

// ── Toolbar ────────────────────────────────────────────────────────────────────
const SvgIcon = ({ children }) => (
    <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        {children}
    </svg>
);

const ICONS = {
    bullet: (
        <SvgIcon>
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3.5" y1="6" x2="3.51" y2="6" />
            <line x1="3.5" y1="12" x2="3.51" y2="12" />
            <line x1="3.5" y1="18" x2="3.51" y2="18" />
        </SvgIcon>
    ),
    ordered: (
        <SvgIcon>
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <path d="M4 6h1v4" />
            <path d="M4 10h2" />
            <path d="M6 18H4c0-1 2-1.4 2-2.5S5 14 4.2 14.6" />
        </SvgIcon>
    ),
    quote: (
        <SvgIcon>
            <path d="M6 7H4a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h2a1 1 0 0 1 1 1v1a2 2 0 0 1-2 2" />
            <path d="M15 7h-2a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h2a1 1 0 0 1 1 1v1a2 2 0 0 1-2 2" />
        </SvgIcon>
    ),
    code: (
        <SvgIcon>
            <path d="M16 18l6-6-6-6" />
            <path d="M8 6l-6 6 6 6" />
        </SvgIcon>
    ),
    link: (
        <SvgIcon>
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </SvgIcon>
    ),
};

function Btn({ label, active, disabled, onClick, children }) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active || undefined}
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()} // keep the editor selection
            onClick={onClick}
            className={cx(
                "flex h-8 min-w-[2rem] items-center justify-center rounded-md px-1.5 text-sm transition-colors disabled:opacity-40",
                active
                    ? "bg-wood-100 text-wood-800"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-800",
            )}
        >
            {children}
        </button>
    );
}

const Sep = () => <span className="mx-0.5 h-5 w-px shrink-0 bg-gray-200" />;

function Toolbar({ editor }) {
    if (!editor) return null;
    const c = () => editor.chain().focus();

    const setLink = () => {
        const prev = editor.getAttributes("link").href;
        const url = window.prompt("Link URL", prev || "https://");
        if (url === null) return; // cancelled
        if (url === "") return c().extendMarkRange("link").unsetLink().run();
        c().extendMarkRange("link").setLink({ href: url }).run();
    };

    return (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 rounded-t-xl border-b border-gray-100 bg-white/90 px-2 py-1.5 backdrop-blur">
            <Btn label="Bold" active={editor.isActive("bold")} onClick={() => c().toggleBold().run()}>
                <span className="font-bold">B</span>
            </Btn>
            <Btn label="Italic" active={editor.isActive("italic")} onClick={() => c().toggleItalic().run()}>
                <span className="font-serif italic">I</span>
            </Btn>
            <Btn label="Strikethrough" active={editor.isActive("strike")} onClick={() => c().toggleStrike().run()}>
                <span className="line-through">S</span>
            </Btn>
            <Sep />
            <Btn label="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => c().toggleHeading({ level: 1 }).run()}>
                <span className="text-xs font-bold">H1</span>
            </Btn>
            <Btn label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => c().toggleHeading({ level: 2 }).run()}>
                <span className="text-xs font-bold">H2</span>
            </Btn>
            <Sep />
            <Btn label="Bullet list" active={editor.isActive("bulletList")} onClick={() => c().toggleBulletList().run()}>
                {ICONS.bullet}
            </Btn>
            <Btn label="Numbered list" active={editor.isActive("orderedList")} onClick={() => c().toggleOrderedList().run()}>
                {ICONS.ordered}
            </Btn>
            <Btn label="Quote" active={editor.isActive("blockquote")} onClick={() => c().toggleBlockquote().run()}>
                {ICONS.quote}
            </Btn>
            <Btn label="Code" active={editor.isActive("code")} onClick={() => c().toggleCode().run()}>
                {ICONS.code}
            </Btn>
            <Btn label="Link" active={editor.isActive("link")} onClick={setLink}>
                {ICONS.link}
            </Btn>
        </div>
    );
}

export default function NoteEditor({ initialValue = "", onChange, placeholder = "Start writing…" }) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder }),
            Link.configure({ openOnClick: false, autolink: true }),
        ],
        content: toHtml(initialValue),
        editorProps: {
            attributes: {
                class: "note-prose min-h-[16rem] px-4 py-3 focus:outline-none",
            },
        },
        onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
        // Avoid an SSR/first-paint hydration warning; we're client-only anyway.
        immediatelyRender: false,
    });

    return (
        // No overflow-hidden here: it would make this box the toolbar's scroll
        // container and kill the toolbar's `sticky top-0`. The editor content is
        // transparent, so the wrapper's rounded corners still read cleanly.
        <div className="rounded-xl border border-gray-200 bg-white focus-within:border-wood-400 focus-within:ring-1 focus-within:ring-wood-400/40">
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
}
