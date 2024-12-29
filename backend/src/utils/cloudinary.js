import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import logger from '../config/logger.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload file to Cloudinary
 * @param {string} filePath - Path to the file to upload
 * @param {Object} options - Additional options for upload
 * @returns {Promise} Cloudinary upload response
 */
export const uploadToCloudinary = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'events',
      resource_type: 'auto'
    });

    // Clean up the local file after successful upload
    fs.unlinkSync(filePath);

    return result;
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    // Clean up the local file even if upload fails
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw new Error('Failed to upload image to Cloudinary');
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Public ID of the file to delete
 * @returns {Promise} Cloudinary deletion response
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    logger.error('Cloudinary deletion error:', error);
    throw new Error('Failed to delete file from Cloudinary');
  }
};

/**
 * Upload multiple files to Cloudinary
 * @param {Array} filePaths - Array of file paths to upload
 * @param {Object} options - Additional options for upload
 * @returns {Promise} Array of Cloudinary upload responses
 */
export const uploadMultipleToCloudinary = async (filePaths, options = {}) => {
  const results = [];
  try {
    for (const filePath of filePaths) {
      const result = await uploadToCloudinary(filePath, options);
      results.push(result);
    }
    return results;
  } catch (error) {
    logger.error('Multiple files upload error:', error);
    // Clean up any remaining files
    filePaths.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
    throw new Error('Failed to upload multiple files to Cloudinary');
  }
};

/**
 * Delete multiple files from Cloudinary
 * @param {Array} publicIds - Array of public IDs to delete
 * @returns {Promise} Array of Cloudinary deletion responses
 */
export const deleteMultipleFromCloudinary = async (publicIds) => {
  try {
    const deletePromises = publicIds.map(publicId => deleteFromCloudinary(publicId));
    return await Promise.all(deletePromises);
  } catch (error) {
    logger.error('Multiple files deletion error:', error);
    throw new Error('Failed to delete multiple files from Cloudinary');
  }
};
