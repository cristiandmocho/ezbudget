import { Router } from "express";
const router = Router();

router.get("/", (req, res) => {
  res.redirect("/dashboard");
});

export default router;
