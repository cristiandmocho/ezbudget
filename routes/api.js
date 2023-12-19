import { Router } from "express";

import * as API from "../controller/api/index.js";

const router = new Router();

router.get("/version", API.VersionGet);

router.get("/holidays", API.HolidayGet);

router.post("/tenant/bysub", API.TenantBySubPost);
router.post("/tenant", API.TenantPost);
router.patch("/tenant", API.TenantPatch);
router.delete("/tenant", API.TenantDelete);
router.get("/tenant/:uid", API.TenantGet);
router.get("/tenant", API.TenantCurrentGet);

router.get("/calendar", API.CalendarGet);
router.post("/calendar", API.CalendarPost);
router.delete("/calendar", API.CalendarDelete);

export default router;
