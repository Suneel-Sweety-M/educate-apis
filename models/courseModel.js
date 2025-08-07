// models/Course.js

import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  lectures: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
    },
  ],
});

const Course = mongoose.model("Course", courseSchema);

export default Course;
