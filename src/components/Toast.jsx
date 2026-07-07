import {
    createContext,
    useCallback,
    useContext,
    useRef,
    useState,
} from "react";
import { cx } from "./ui.jsx";

// Tiny toast system for success/error feedback after a create / update / delete.
// useToast() returns { success, error } — call them with a message.

const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timers = useRef(new Map());

    const dismiss = useCallback((id) => {
        setToasts((list) => list.filter((t) => t.id !== id));
        const timer = timers.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timers.current.delete(id);
        }
    }, []);

    const push = useCallback(
        (tone, message) => {
            const id = nextId++;
            setToasts((list) => [...list, { id, tone, message }]);
            timers.current.set(
                id,
                setTimeout(() => dismiss(id), 4500),
            );
        },
        [dismiss],
    );

    const api = useRef({
        success: (m) => push("success", m),
        error: (m) => push("error", m),
    });

    return (
        <ToastContext.Provider value={api.current}>
            {children}
            <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
                {toasts.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => dismiss(t.id)}
                        className={cx(
                            "pointer-events-auto w-full max-w-sm rounded-lg px-4 py-3 text-left text-sm font-medium shadow-lg",
                            t.tone === "error"
                                ? "bg-red-600 text-white"
                                : "bg-gray-900 text-white",
                        )}
                    >
                        {t.message}
                    </button>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
    return ctx;
}
