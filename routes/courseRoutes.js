import express from 'express';
import { getCourses, getCourse, createCourse, updateCourse, deleteCourse } from '../controllers/coursesController.js';
import upload, { uploadCourseAssetsToS3 } from '../middleware/upload.js';

const router = express.Router();

const courseUploadFields = upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 },
  { name: 'instructorPic', maxCount: 1 },
]);

router.get('/all', getCourses);
router.get('/:courseId', getCourse);
router.post('/create', courseUploadFields, uploadCourseAssetsToS3, createCourse);
router.put('/:courseId/edit', courseUploadFields, uploadCourseAssetsToS3, updateCourse);
router.delete('/:courseId/delete', deleteCourse);

export default router;
