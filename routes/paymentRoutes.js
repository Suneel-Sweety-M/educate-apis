import express from 'express';
import {
  createOrder,
  verifyPayment,
  getEnrollments,
  markPaid
} from '../controllers/paymentController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/api/payments/:courseId/create-order', authMiddleware, createOrder);
router.post('/api/payments/verify', authMiddleware, verifyPayment);
router.get('/api/enrollments', authMiddleware, getEnrollments);
router.post('/api/enrollments/:courseId/mark-paid', authMiddleware, markPaid);

export default router;
