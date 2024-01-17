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

router.get("/movements", API.MovementsGet);
router.get("/movement/:uid", API.MovementGet);
router.post("/movement", API.MovementPost);
router.patch("/movement/:uid", API.MovementPatch);
router.delete("/movement/:uid", API.MovementDelete);

export default router;
