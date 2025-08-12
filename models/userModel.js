import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["teacher", "student"], // Changed from ['teacher', 'user'] to ['teacher', 'student']
    default: "student",
    required: true,
  },
  otp: { type: String },
  otpExpires: { type: Date },
  isVerified: { type: Boolean, default: false },
  refreshToken: { type: String },
});

export default mongoose.model("User", UserSchema);