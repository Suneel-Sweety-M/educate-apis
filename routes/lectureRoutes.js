// routes/lectureRoutes.js

import express from "express";
import multer from "multer";

import {
  addLecture,
  deleteLecture,
  editLecture,
  GetLecture,
  getLectureByCourseAndId,
} from "../controllers/lectureController.js";

const router = express.Router();

// Use memory storage for file uploads (buffer access)
const uploadMemory = multer({ storage: multer.memoryStorage() });

// Add Lecture
router.post(
  "/api/courses/:courseId/lectures/add",
  uploadMemory.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  addLecture
);

// ✅ Get all lectures for a specific course
router.get("/api/courses/:courseId/lectures", GetLecture);

// Get a specific lecture by courseId and lectureId
// ✅ Get a specific lecture by courseId and lectureId
router.get(
  "/api/courses/:courseId/lectures/:lectureId",
  getLectureByCourseAndId
);

// Delete Lecture
router.delete(
  "/api/courses/:courseId/lectures/:lectureId/delete",
  deleteLecture
);

// Edit Lecture
router.put(
  "/api/courses/:courseId/lectures/:lectureId/edit",
  uploadMemory.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  editLecture
);

export default router;
