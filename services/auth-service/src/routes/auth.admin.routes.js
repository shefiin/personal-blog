import { Router } from "express";
import { validateRequest } from "../middlewares/validateRequest.js";
import { adminLogin, refreshToken } from "../controllers/auth.admin.controller.js";
import { loginSchema } from "../validators/auth.validators.js";

const router = Router();

router.post("/login", validateRequest(loginSchema), adminLogin);
router.post("/refresh", refreshToken);


export default router;