// models/Lecture.js

import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  title: { type: String, required: true },
  description: { type: String },
  lectureThumbnail: { type: String },
  video: { type: String },
});

const Lecture = mongoose.model("Lecture", lectureSchema);

export default Lecture;
