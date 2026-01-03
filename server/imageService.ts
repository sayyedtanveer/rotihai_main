import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(__dirname, "..", "attached_assets", "uploads");

// Ensure directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configuration
const IMAGE_CONFIG = {
  UPLOADS_DIR,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIMETYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
};

export interface ImageUploadResult {
  success: boolean;
  filename?: string;
  url?: string;
  error?: string;
  fileSize?: number;
}

/**
 * Validate image file
 */
export const validateImageFile = (
  file: Express.Multer.File
): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  // Check file size
  if (file.size > IMAGE_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${IMAGE_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB limit`,
    };
  }

  // Check MIME type
  if (!IMAGE_CONFIG.ALLOWED_MIMETYPES.includes(file.mimetype)) {
    return {
      valid: false,
      error: `File type ${file.mimetype} not allowed. Allowed: ${IMAGE_CONFIG.ALLOWED_MIMETYPES.join(", ")}`,
    };
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!IMAGE_CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `File extension ${ext} not allowed. Allowed: ${IMAGE_CONFIG.ALLOWED_EXTENSIONS.join(", ")}`,
    };
  }

  return { valid: true };
};

/**
 * Save uploaded image to disk
 */
export const saveImageFile = (file: Express.Multer.File): ImageUploadResult => {
  try {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generate unique filename: timestamp + random + original extension
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
    const filepath = path.join(IMAGE_CONFIG.UPLOADS_DIR, filename);

    // Write file to disk
    fs.writeFileSync(filepath, file.buffer);

    // Return relative URL path (for database storage)
    const url = `/uploads/${filename}`;

    return {
      success: true,
      filename,
      url,
      fileSize: file.size,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to save image: ${error.message}`,
    };
  }
};

/**
 * Get image file path
 */
export const getImagePath = (filename: string): string => {
  return path.join(IMAGE_CONFIG.UPLOADS_DIR, filename);
};

/**
 * Check if image file exists
 */
export const imageExists = (filename: string): boolean => {
  const filepath = getImagePath(filename);
  return fs.existsSync(filepath);
};

/**
 * Delete image file
 */
export const deleteImageFile = (filename: string): boolean => {
  try {
    const filepath = getImagePath(filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return true;
    }
    return false;
  } catch (error: any) {
    console.error("Failed to delete image:", error.message);
    return false;
  }
};

/**
 * Extract filename from URL
 */
export const extractFilenameFromUrl = (url: string): string | null => {
  // URL format: /uploads/filename.ext
  if (!url || !url.startsWith("/uploads/")) {
    return null;
  }
  return url.substring("/uploads/".length);
};

/**
 * Replace old image with new one
 */
export const replaceImageFile = (
  oldUrl: string,
  newFile: Express.Multer.File
): ImageUploadResult => {
  // Save new image first
  const result = saveImageFile(newFile);
  if (!result.success) {
    return result;
  }

  // Delete old image if exists
  if (oldUrl) {
    const oldFilename = extractFilenameFromUrl(oldUrl);
    if (oldFilename) {
      deleteImageFile(oldFilename);
    }
  }

  return result;
};

/**
 * Get uploads directory path
 */
export const getUploadsDir = (): string => {
  return IMAGE_CONFIG.UPLOADS_DIR;
};

export default {
  validateImageFile,
  saveImageFile,
  getImagePath,
  imageExists,
  deleteImageFile,
  extractFilenameFromUrl,
  replaceImageFile,
  getUploadsDir,
  IMAGE_CONFIG,
};
