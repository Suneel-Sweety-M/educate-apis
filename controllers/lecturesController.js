// controllers/lectureController.js

import Lecture from "../models/lectureModel.js";
import Course from "../models/courseModel.js";
import { S3 } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const s3 = new S3({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadToS3 = async (file, key) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await s3.putObject(params);

  const s3Url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  return s3Url;
};


// Add Lecture Controller
export const addLecture = async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    console.log("Request Files:", req.files);

    const { courseId } = req.params;
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    // Validate course existence
    const course = await Course.findById(courseId);

    const thumbnailFile = req.files?.thumbnail?.[0];
    const videoFile = req.files?.video?.[0];

    if (!thumbnailFile && !videoFile) {
      return res.status(400).json({
        error: "At least one file (thumbnail or video) is required",
      });
    }

    let thumbnailUrl = null;
    let videoUrl = null;

    if (thumbnailFile) {
      const ext = thumbnailFile.originalname.split(".").pop();
      const thumbnailKey = `thumbnails/${Date.now()}.${ext}`;
      thumbnailUrl = await uploadToS3(thumbnailFile, thumbnailKey);
    }

    if (videoFile) {
      const ext = videoFile.originalname.split(".").pop();
      const videoKey = `videos/${Date.now()}.${ext}`;
      videoUrl = await uploadToS3(videoFile, videoKey);
    }

    const newLecture = new Lecture({
      courseId,
      title,
      description,
      lectureThumbnail: thumbnailUrl,
      video: videoUrl,
    });

    await newLecture.save();

    if (course) {
      course.lectures.push(newLecture._id);
      await course.save();
    }

    res.status(201).json({
      message: "Lecture added successfully",
      lecture: newLecture,
    });
  } catch (error) {
    console.error("Add Lecture Error:", error);
    res.status(500).json({ error: error.message || "Server Error" });
  }
};

// Delete Lecture Controller
export const deleteLecture = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ error: "Lecture not found" });
    }

    await Course.findByIdAndUpdate(courseId, {
      $pull: { lectures: lectureId },
    });

    await Lecture.findByIdAndDelete(lectureId);

    res.json({ message: "Lecture deleted successfully" });
  } catch (error) {
    console.error("Delete Lecture Error:", error);
    res.status(500).json({ error: error.message || "Server error" });
  }
};

// Edit Lecture Controller
export const editLecture = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    const { title, description } = req.body;

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ error: "Lecture not found" });
    }

    const thumbnailFile = req.files?.thumbnail?.[0];
    if (thumbnailFile) {
      const ext = thumbnailFile.originalname.split(".").pop();
      const thumbnailKey = `thumbnails/${Date.now()}.${ext}`;
      const newThumbnailUrl = await uploadToS3(thumbnailFile, thumbnailKey);
      lecture.lectureThumbnail = newThumbnailUrl;
    }

    const videoFile = req.files?.video?.[0];
    if (videoFile) {
      const ext = videoFile.originalname.split(".").pop();
      const videoKey = `videos/${Date.now()}.${ext}`;
      const newVideoUrl = await uploadToS3(videoFile, videoKey);
      lecture.video = newVideoUrl;
    }

    if (title) lecture.title = title;
    if (description) lecture.description = description;

    await lecture.save();

    res.json({ message: "Lecture updated successfully", lecture });
  } catch (error) {
    console.error("Edit Lecture Error:", error);
    res.status(500).json({ error: error.message || "Server Error" });
  }
};
