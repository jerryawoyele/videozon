import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import logger from '../config/logger.js';
import dotenv from 'dotenv';
dotenv.config()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'videozon',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});

export const upload = multer({ storage });

export const uploadFile = async (file, folder = 'general') => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: `videozon/${folder}`
    });
    return result.secure_url;
  } catch (error) {
    logger.error('File upload failed:', error);
    throw error;
  }
};

export const deleteFile = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    logger.error('File deletion failed:', error);
    throw error;
  }
};

export const uploadMultipleFiles = async (files, folder = 'general') => {
  try {
    const uploadPromises = files.map(file => uploadFile(file, folder));
    return await Promise.all(uploadPromises);
  } catch (error) {
    logger.error('Multiple files upload failed:', error);
    throw error;
  }
}; 