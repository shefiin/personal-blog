import { Router } from "express";
import { googleAuthCallback, googleAuthStart, login, logout, refresh, register, resendOtp, session, verifyOtp } from "../controllers/auth.controller.js";
import { loginSchema, resendOtpSchema, userRegisterSchema, verifyOtpSchema } from "../validators/auth.validators.js";
import { validateRequest } from "../middlewares/validateRequest.js";

const router = Router();

router.post("/login", validateRequest(loginSchema), login);
router.get("/google", googleAuthStart);
router.get("/google/callback", googleAuthCallback);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/session", session);
router.post("/register", validateRequest(userRegisterSchema), register);
router.post("/verify-otp", validateRequest(verifyOtpSchema), verifyOtp);
router.post("/resend-otp", validateRequest(resendOtpSchema), resendOtp);

export default router;
