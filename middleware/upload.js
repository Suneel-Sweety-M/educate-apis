// upload.js

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { promises as fsp } from 'fs';

dotenv.config();

// S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype.toLowerCase());

  if (extname && mimetype) cb(null, true);
  else cb(new Error('Only image files are allowed (jpeg, jpg, png, webp)'), false);
};

const uploadPath = path.join(process.cwd(), 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const filename = `${Date.now()}-${file.originalname}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter,
});

// Upload to S3
async function uploadToS3(file, bucketName) {
  const fileContent = await fsp.readFile(file.path);
  const key = `uploads/${Date.now()}-${file.originalname}`;

  const params = {
    Bucket: bucketName,
    Key: key,
    Body: fileContent,
    ContentType: file.mimetype,
  };

  const command = new PutObjectCommand(params);
  await s3Client.send(command);
  await fsp.unlink(file.path); // delete temp file

  return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

// Middleware: uploads each file to S3 and sets URLs in req.body
export const uploadCourseAssetsToS3 = async (req, res, next) => {
  try {
    const fields = ['thumbnail', 'logo', 'banner', 'instructorPic'];
    for (const field of fields) {
      if (req.files?.[field]?.[0]) {
        const file = req.files[field][0];
        const url = await uploadToS3(file, process.env.AWS_BUCKET_NAME);
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
