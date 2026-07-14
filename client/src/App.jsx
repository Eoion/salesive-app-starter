import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ShopProvider, useShop } from "./lib/shop.jsx";
import { SocketProvider } from "./lib/socket.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import Layout from "./components/Layout.jsx";
import { Loading, NoShop } from "./components/States.jsx";
import NotesShell, { NotesEmpty } from "./routes/notes/NotesShell.jsx";
import NoteCreate from "./routes/notes/NoteCreate.jsx";
import NoteDetail from "./routes/notes/NoteDetail.jsx";
import Install from "./routes/Install.jsx";
import NotFound from "./routes/NotFound.jsx";

// Client-side routes (react-router). These must NOT collide with the backend
// paths (/api, /oauth, /webhooks) — the server handles those before the SPA ever
// loads. The install gate lives at /install; OAuth itself is /oauth/* on the
// server. Everything under the guarded Layout is the installed notes app, laid
// out as master-detail by NotesShell (list + detail side-by-side on PC, one pane
// at a time on phones):
//
//   /                    notes list (+ "no note selected" on PC)
//   /notes/new           create a note
//   /notes/:id           note detail — edit + delete
//   /install             install gate
//   *                    in-app 404
export default function App() {
    return (
        <ShopProvider>
            <ToastProvider>
                <SocketProvider>
                    <Routes>
                        <Route
                            element={
                                <RequireInstall>
                                    <Layout />
                                </RequireInstall>
                            }
                        >
                            {/* Master-detail: the list is a persistent pane in
                                NotesShell; these render in the detail pane. */}
                            <Route element={<NotesShell />}>
                                <Route index element={<NotesEmpty />} />
                                <Route path="notes/new" element={<NoteCreate />} />
                                <Route path="notes/:id" element={<NoteDetail />} />
                            </Route>
                        </Route>
                        <Route path="/install" element={<Install />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </SocketProvider>
            </ToastProvider>
        </ShopProvider>
    );
}

// Gate for routes that need an authenticated session (a completed install bound to
// THIS browser via the session cookie — see server/session.js). Fails closed: with
// no session it shows the install gate (when we know which store to install for) or
// the "open from dashboard" notice otherwise.
function RequireInstall({ children }) {
    const { launchShop, me, loading, authenticated } = useShop();
    const location = useLocation();

    if (loading || !me) return <Loading />;
    if (!authenticated) {
        if (!launchShop) return <NoShop />;
        return <Navigate to={`/install${location.search}`} replace />;
    }
    return children;
}
