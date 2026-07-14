// Small presentation helpers shared across the notes pages. No dependencies —
// just Intl and Date.

export function formatDate(value) {
    const d = value ? new Date(value) : null;
    if (!d || Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export function formatDateTime(value) {
    const d = value ? new Date(value) : null;
    if (!d || Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

// Flatten a note body (Markdown + HTML) to a short plain-text preview for the
// list — so a card shows "Hi", not "<p>Hi</p>" or "## Heading".
export function toPlainText(body) {
    if (!body) return "";
    return String(body)
        .replace(/```[\s\S]*?```/g, " ") // fenced code blocks
        .replace(/<[^>]*>/g, " ") // HTML tags
        .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → their text
        .replace(/`([^`]*)`/g, "$1") // inline code
        .replace(/^[>#\s]*[-*+]?\s+/gm, "") // leading list / heading / quote markers
        .replace(/[*_~]/g, "") // emphasis markers
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/\s+/g, " ")
        .trim();
}

// A short relative time ("just now", "5m ago", "3h ago", "2d ago"); falls back to
// an absolute date for anything older than a week. Used on the notes list so the
// most-recently-touched notes read at a glance.
export function timeAgo(value) {
    const d = value ? new Date(value) : null;
    if (!d || Number.isNaN(d.getTime())) return "—";
    const secs = Math.round((Date.now() - d.getTime()) / 1000);
    if (secs < 45) return "just now";
    const mins = Math.round(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    if (days <= 7) return `${days}d ago`;
    return formatDate(value);
}
