import { v2 as cloudinary } from "cloudinary";
import { Router } from "express";
import multer from "multer";
import { Readable } from "stream";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Setup multer for file uploads (stored in memory)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

const router = Router();

/**
 * Upload image to Cloudinary
 * POST /api/upload
 * Body: FormData with 'file' field
 */
router.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "rotihai", // Organize in "rotihai" folder
          resource_type: "auto",
          quality: "auto", // Auto-optimize compression
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // Convert buffer to stream
      Readable.from(req.file!.buffer).pipe(stream);
    });

    console.log("✅ Image uploaded to Cloudinary:", (result as any).secure_url);

    return res.json({
      success: true,
      url: (result as any).secure_url, // Use secure_url (HTTPS)
      public_id: (result as any).public_id,
    });
  } catch (error: any) {
    console.error("❌ Upload error:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Delete image from Cloudinary
 * POST /api/delete-image
 * Body: { public_id: "cloudinary_public_id" }
 */
router.post("/api/delete-image", async (req, res) => {
  try {
    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({ error: "public_id required" });
    }

    await cloudinary.uploader.destroy(public_id);
    return res.json({ success: true, message: "Image deleted" });
  } catch (error: any) {
    console.error("❌ Delete error:", error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
