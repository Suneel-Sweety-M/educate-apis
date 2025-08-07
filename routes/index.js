import express from 'express';

import authRoute from './authRoutes.js';
import userRoute from './userRoutes.js';
import courseRoute from './courseRoutes.js';
import paymentRoute from './paymentRoutes.js';
import lectureRoute from './lectureRoutes.js';

const router = express.Router();

router.use("/auth", authRoute);
router.use("/user", userRoute);
router.use("/course", courseRoute);
router.use("/payment", paymentRoute);
router.use("/lectures", lectureRoute);


export default router;