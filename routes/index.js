import express from 'express';

import authRoute from './authRoutes.js';
import userRoute from './userRoutes.js';
import courseRoute from './courseRoutes.js';
import paymentRoute from './paymentRoutes.js';

const router = express.Router();

router.use("/api/auth", authRoute);
router.use("/user", userRoute);
router.use("/api/course", courseRoute);
router.use("/payment", paymentRoute);

export default router;