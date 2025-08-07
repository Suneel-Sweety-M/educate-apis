import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';

// Debug environment variables
console.log('In paymentController.js:');
console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID);
console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET);

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error('Razorpay keys are not defined in environment variables');
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

export const createOrder = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.id;

    console.log('Create Order Request:', { courseId, userId });

    const course = await Course.findById(courseId);
    console.log('Found Course:', course);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!course.price || isNaN(course.price)) {
      return res.status(400).json({ message: 'Invalid course price' });
    }

    const options = {
      amount: course.price * 100,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    console.log('Razorpay order created:', order.id);

    await Payment.create({
      userId,
      courseId,
      razorpayOrderId: order.id,
      amount: course.price
    });

    console.log("Sending response to frontend:", {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('Create order error:', JSON.stringify(error, null, 2));
    if (error.statusCode === 401) {
      return res.status(401).json({ message: 'Razorpay authentication failed', error: error.error });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.id;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      const payment = await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: 'paid'
        },
        { new: true }
      );

      if (!payment) {
        console.error('Payment not found for order:', razorpay_order_id);
        return res.status(404).json({ message: 'Payment not found' });
      }

      await Enrollment.findOneAndUpdate(
        { userId, courseId: payment.courseId },
        { paymentStatus: 'completed' },
        { upsert: true }
      );

      console.log('Payment verified successfully:', razorpay_payment_id);
      res.json({ message: 'Payment verified successfully' });
    } else {
      console.error('Invalid signature for order:', razorpay_order_id);
      res.status(400).json({ message: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Verify payment error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getEnrollments = async (req, res) => {
  try {
    const userId = req.user.id;

    const enrollments = await Enrollment.find({ userId }).populate('userId courseId');
    res.json(enrollments);
  } catch (error) {
    console.error('Get enrollments error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const markPaid = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const enrollment = await Enrollment.findOneAndUpdate(
      { userId, courseId },
      { paymentStatus: 'completed' },
      { new: true }
    );

    if (!enrollment) {
      console.error('Enrollment not found for user:', userId, 'course:', courseId);
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    console.log('Payment marked as paid for enrollment:', enrollment._id);
    res.json({ message: 'Payment marked as paid' });
  } catch (error) {
    console.error('Mark paid error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
