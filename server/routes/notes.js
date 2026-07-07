import { Router } from "express";
import { requireShop } from "../middleware/requireShop.js";
import { proxy, passthroughQuery, seg } from "./proxy.js";

// Notes CRUD, mounted at /api/notes (server/routes/index.js). Proxied to the
// Salesive Apps API's notes resource with the store-scoped app token.
//
//   GET    /api/notes          list (newest first; optional ?userId=)
//   POST   /api/notes          create ({ title, body })
//   GET    /api/notes/:id      one note
//   PUT    /api/notes/:id      update ({ title?, body? })
//   DELETE /api/notes/:id      delete (soft-delete server-side)
//
// Unlike the catalog resources, the notes list endpoint has NO server-side
// pagination or text search — it returns every note for the store, newest first,
// and the envelope's `data` is the raw array (not { notes, pagination }). The UI
// searches/filters client-side over that array.
const router = Router();
router.use(requireShop);

const UPSTREAM = "/api/v1/notes";

router.get("/", (req, res, next) =>
    proxy(req, res, next, {
        // `userId` is the only filter the notes endpoint honours.
        path: `${UPSTREAM}${passthroughQuery(req.query, ["userId"])}`,
    }),
);

router.post("/", (req, res, next) =>
    proxy(req, res, next, { path: UPSTREAM, method: "POST", body: req.body }),
);

router.get("/:id", (req, res, next) =>
    proxy(req, res, next, { path: `${UPSTREAM}/${seg(req.params.id)}` }),
);

router.put("/:id", (req, res, next) =>
    proxy(req, res, next, {
        path: `${UPSTREAM}/${seg(req.params.id)}`,
        method: "PUT",
        body: req.body,
    }),
);

router.delete("/:id", (req, res, next) =>
    proxy(req, res, next, {
        path: `${UPSTREAM}/${seg(req.params.id)}`,
        method: "DELETE",
    }),
);

export default router;
