import { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useShop } from "./shop.jsx";

// One shared socket.io connection for the whole authenticated app. Pages subscribe
// to live store events via useWebhook() to auto-refresh their data.
//
// Same-origin + withCredentials sends the HttpOnly session cookie on the
// handshake, and the SERVER derives which store's room to join from that session
// (server/sockets.js) — the client never names a room. We only open the socket
// once authenticated, so the install gate doesn't spin on a rejected handshake.

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
    const { authenticated } = useShop();
    const listeners = useRef(new Set());

    useEffect(() => {
        if (!authenticated) return;
        // withCredentials sends the session cookie on the handshake; the server
        // derives which store's room to join from it (server/sockets.js).
        const socket = io({ withCredentials: true });
        socket.on("webhook", (payload) => {
            for (const fn of listeners.current) {
                try {
                    fn(payload);
                } catch {
                    /* a misbehaving listener must not kill the others */
                }
            }
        });
        return () => socket.close();
    }, [authenticated]);

    return (
        <SocketContext.Provider value={{ listeners }}>
            {children}
        </SocketContext.Provider>
    );
}

// Subscribe to live webhook payloads. `handler` is called with each payload
// ({ type:"event"|"record", event, resource, ... }). Keep `deps` stable; the
// handler is re-registered when they change. Typical use: refetch a list when an
// event for its resource arrives.
export function useWebhook(handler, deps = []) {
    const ctx = useContext(SocketContext);
    const ref = useRef(handler);
    ref.current = handler;

    useEffect(() => {
        if (!ctx) return undefined;
        const fn = (payload) => ref.current(payload);
        ctx.listeners.current.add(fn);
        return () => ctx.listeners.current.delete(fn);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ctx, ...deps]);
}

// The resource name carried by a webhook payload, whichever shape it arrived in.
export function webhookResource(payload) {
    return payload?.resource || payload?.event?.resource || null;
}
