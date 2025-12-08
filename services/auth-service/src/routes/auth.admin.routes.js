import { Router } from "express";
import { validateRequest } from "../middlewares/validateRequest.js";
import { adminLogin, adminLogout, refreshToken, sessionCheck } from "../controllers/auth.admin.controller.js";
import { loginSchema } from "../validators/auth.validators.js";

const router = Router();

router.post("/login", validateRequest(loginSchema), adminLogin);
router.post("/refresh", refreshToken);
router.post("/logout", adminLogout);
router.post("/session", sessionCheck)


export default router;