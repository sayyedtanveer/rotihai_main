import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

// Configure Cloudinary from environment
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface ImageUploadResult {
  success: boolean;
  filename?: string;
  url?: string;
  public_id?: string;
  error?: string;
  fileSize?: number;
}

// Configuration
const IMAGE_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIMETYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
};

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

  return { valid: true };
};

/**
 * Upload image to Cloudinary (replaces saveImageFile)
 */
export const saveImageFile = async (
  file: Express.Multer.File,
  folder: string = "rotihai"
): Promise<ImageUploadResult> => {
  try {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return {
        success: false,
        error: "Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME in environment",
      };
    }

    console.log(`⏳ Uploading image to Cloudinary/${folder}...`);

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: "auto",
          quality: "auto:good", // Auto-optimize
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // Convert buffer to stream
      Readable.from(file.buffer).pipe(stream);
    });

    const url = result.secure_url; // Use HTTPS URL

    console.log(`✅ Image uploaded to Cloudinary: ${url}`);

    return {
      success: true,
      filename: result.public_id,
      url,
      public_id: result.public_id,
      fileSize: file.size,
    };
  } catch (error: any) {
    console.error("❌ Upload error:", error.message);
    return {
      success: false,
      error: error.message || "Failed to upload image",
    };
  }
};

/**
 * Delete image from Cloudinary
 */
export const deleteImageFile = async (public_id: string): Promise<boolean> => {
  try {
    if (!public_id) return false;

    await cloudinary.uploader.destroy(public_id);
    console.log(`✅ Deleted from Cloudinary: ${public_id}`);
    return true;
  } catch (error: any) {
    console.error("❌ Delete error:", error.message);
    return false;
  }
};

/**
 * Get image path (returns the URL directly)
 */
export const getImagePath = (filename: string): string => {
  // For Cloudinary URLs, return as-is since they're already full URLs
  if (filename.startsWith("http")) {
    return filename;
  }
  // Fallback for old local URLs
  return `/uploads/${filename}`;
};

/**
 * Check if image exists (Cloudinary doesn't need this, but keep for compatibility)
 */
export const imageExists = (filename: string): boolean => {
  // For Cloudinary URLs, assume they exist (no need to check)
  return filename.startsWith("http") || filename.length > 0;
};

export { cloudinary };
