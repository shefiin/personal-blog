import { Router } from "express";
import { validateRequest } from "../middlewares/validateRequest.js";
import { register, login, refresh, logout, verifyRegisterOTP, resendOTP, forgotPassword, verifyResetOTP, resetPassword } from "../controllers/auth.user.controller.js";
import { registerSchema, loginSchema } from "../validators/auth.validators.js";

const router = Router();

router.post("/register", validateRequest(registerSchema), register);
router.post("/verify-otp", verifyRegisterOTP);
router.post("/resend-otp", resendOTP)
router.post("/login", validateRequest(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOTP);
router.post("/reset-password", resetPassword);


export default router;
