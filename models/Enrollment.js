// models/enrollmentModel.js
import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  enrolledAt: { type: Date, default: Date.now },
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' }
});

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
export default Enrollment;
