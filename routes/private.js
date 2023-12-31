import { Router } from "express";
import pkg from "express-openid-connect";
const { requiresAuth } = pkg;

const router = Router();
router.use(requiresAuth());

// Controllers
import * as Web from "../controller/web/index.js";

// Routes
router.get("/dashboard", Web.DashboardHandler);
router.get("/profile", Web.ProfileHandler);
router.get("/movements", Web.MovementHandler);
router.get("/categories", Web.CategoriesHandler);

export default router;
