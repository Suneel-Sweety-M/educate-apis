import mongoose from "mongoose";


const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters'],
  },
  thumbnail: {
    type: String,
    required: [true, 'Thumbnail is required'],
  },
  logo: {
    type: String,
    required: [true, 'Logo is required'],
  },
  banner: {
    type: String,
    required: [true, 'Banner is required'],
  },
  instructorName: {
    type: String,
    required: [true, 'Instructor name is required'],
    trim: true,
    maxlength: [50, 'Instructor name cannot be more than 50 characters'],
  },
  instructorPic: {
    type: String,
    required: [true, 'Instructor picture is required'],
  },
  instructorSummary: {
    type: String,
    required: [true, 'Instructor summary is required'],
    trim: true,
    maxlength: [500, 'Instructor summary cannot be more than 500 characters'],
  },
  courseVideo: {
    type: String,
    required: [true, 'Course video is required'],
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Course = mongoose.model('Course', courseSchema);

export default Course;
