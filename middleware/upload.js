import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Allow image and video formats
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|webp/;
  const allowedVideoTypes = /mp4|mov|avi|webm|mkv/;

  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype.toLowerCase();

  if (allowedImageTypes.test(extname) || allowedVideoTypes.test(extname)) {
    cb(null, true);
  } else {
    cb(
      new Error('Only image and video files are allowed (jpeg, jpg, png, webp, mp4, mov, avi, webm, mkv)'),
      false
    );
  }
};

// Use memoryStorage to avoid local disk
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // Allow large uploads (100MB)
  fileFilter,
});

// Upload to S3 directly from memory
async function uploadToS3(fileBuffer, fileName, mimeType, bucketName) {
  const key = `uploads/${Date.now()}-${fileName}`;

  const params = {
    Bucket: bucketName,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
  };

  const command = new PutObjectCommand(params);
  await s3Client.send(command);

  return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

// Middleware: uploads images/videos to S3 and sets URLs in req.body
export const uploadCourseAssetsToS3 = async (req, res, next) => {
  try {
    const fields = ['thumbnail', 'logo', 'banner', 'instructorPic', 'courseVideo'];

    for (const field of fields) {
      if (req.files?.[field]?.[0]) {
        const file = req.files[field][0];
        const url = await uploadToS3(
          file.buffer,
          file.originalname,
          file.mimetype,
          process.env.AWS_BUCKET_NAME
        );
        req.body[field] = url;
      }
    }

    next();
  } catch (err) {
    console.error('S3 Upload Error:', err);
    res.status(500).json({ message: 'File upload failed', error: err.message });
  }
};

export default upload;
