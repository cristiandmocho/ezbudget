import { Router } from "express";

import * as API from "../controller/api/index.js";

const router = new Router();

router.get("/version", API.VersionGet);

router.get("/holidays", API.HolidayGet);

router.get("/tenant", API.TenantGet);
router.post("/tenant", API.TenantPost);
router.patch("/tenant", API.TenantPatch);
router.delete("/tenant", API.TenantDelete);

router.get("/calendar", API.CalendarGet);
router.post("/calendar", API.CalendarPost);
router.delete("/calendar", API.CalendarDelete);

router.get("/categories", API.CategoriesGet);
router.get("/category/:uid", API.CategoryGet);
router.post("/category", API.CategoryPost);
router.patch("/category/:uid", API.CategoryPatch);
router.delete("/category/:uid", API.CategoryDelete);

export default router;
