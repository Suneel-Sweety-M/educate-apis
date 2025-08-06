// routes/lectureRoutes.js

import express from "express";
import multer from "multer";

import {
  addLecture,
  deleteLecture,
  editLecture
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
