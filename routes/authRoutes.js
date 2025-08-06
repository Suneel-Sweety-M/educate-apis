import express from "express";
import { FORGOT_PASSWORD, LOGIN, LOGOUT, REGISTER, RESET_PASSWORD } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", REGISTER);
router.post("/login", LOGIN);
router.post("/verify-otp", VERIFY_OTP);
router.post("/resend-otp", RESEND_OTP);
router.post("/forgot-password", FORGOT_PASSWORD);
router.post("/reset-password/:token", RESET_PASSWORD);
// router.post("/refresh-token", refreshToken);
router.post("/logout", LOGOUT);

export default router;





