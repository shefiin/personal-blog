import { Router } from "express";
import { validateRequest } from "../middlewares/validateRequest.js";
import { register, login, refresh, logout } from "../controllers/auth.user.controller.js";
import { registerSchema, loginSchema } from "../validators/auth.validators.js";

const router = Router();

router.post("/register", validateRequest(registerSchema), register);
router.post("/login", validateRequest(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);


export default router;