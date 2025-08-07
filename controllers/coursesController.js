import Course from '../models/courseModel.js';
import mongoose from 'mongoose';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Get all courses
// @route   GET /api/courses/all
// @access  Public
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch courses', error: err.message });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:courseId
// @access  Public
export const getCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json(course);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch course', error: err.message });
  }
};

// @desc    Create new course
// @route   POST /api/courses/create
// @access  Private
export const createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      instructorName,
      instructorSummary,
      thumbnail,
      logo,
      banner,
      instructorPic,
      courseVideo,
    } = req.body;

    if (!thumbnail || !logo || !banner || !instructorPic || !courseVideo || !title || !description || !instructorName || !instrcutorSummary) {
      return res.status(400).json({
        message: 'All image fields are required (thumbnail, logo, banner, instructorPic)',
      });
    }

    const course = await Course.create({
      title,
      description,
      thumbnail,
      logo,
      banner,
      instructorName,
      instructorPic,
      instructorSummary,
      courseVideo,
    });

    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create course', error: err.message });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:courseId/edit
// @access  Private
export const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const updatedData = {
      title: req.body.title || course.title,
      description: req.body.description || course.description,
      instructorName: req.body.instructorName || course.instructorName,
      instructorSummary: req.body.instructorSummary || course.instructorSummary,
      thumbnail: req.body.thumbnail || course.thumbnail,
      logo: req.body.logo || course.logo,
      banner: req.body.banner || course.banner,
      instructorPic: req.body.instructorPic || course.instructorPic,
      courseVideo: req.body.courseVideo || course.courseVideo,
    };

    const updatedCourse = await Course.findByIdAndUpdate(courseId, updatedData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updatedCourse);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update course', error: err.message });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:courseId/delete
// @access  Private
export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    await course.remove();
    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete course', error: err.message });
  }
};
