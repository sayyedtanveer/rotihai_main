import { useState, useRef } from "react";
import api from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, Check, Crop } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import ReactCrop, { type Crop as CropType, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageUploaderProps {
  onImageUpload: (url: string) => void;
  disabled?: boolean;
}

// Center the crop area perfectly in the image bounds initially
function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      { unit: '%', width: 90 },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export function ImageUploader({ onImageUpload, disabled = false }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>();
  const { toast } = useToast();

  const [imgSrc, setImgSrc] = useState("");
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const imgRef = useRef<HTMLImageElement>(null);

  const aspect = 16 / 9; // Enforce widescreen for chef cards

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast({ title: "Invalid file type", description: "Only JPEG, PNG, WebP, and GIF images are allowed", variant: "destructive" });
      return;
    }

    setSelectedFileName(file.name);

    // Read file for cropping
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImgSrc(reader.result?.toString() || "");
      setIsCropDialogOpen(true);
    });
    reader.readAsDataURL(file);

    // Reset input
    if (event.target) event.target.value = "";
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspect));
  };

  const uploadCroppedImage = async () => {
    if (!completedCrop || !imgRef.current) return;

    try {
      setIsUploading(true);
      setIsCropDialogOpen(false); // Close dialog while uploading

      // 1. Draw cropped image onto canvas
      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("No 2d context");

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const pixelRatio = window.devicePixelRatio;

      canvas.width = Math.floor(completedCrop.width * scaleX * pixelRatio);
      canvas.height = Math.floor(completedCrop.height * scaleY * pixelRatio);

      ctx.scale(pixelRatio, pixelRatio);
      ctx.imageSmoothingQuality = 'high';

      const cropX = completedCrop.x * scaleX;
      const cropY = completedCrop.y * scaleY;
      const cropWidth = completedCrop.width * scaleX;
      const cropHeight = completedCrop.height * scaleY;

      ctx.translate(-cropX, -cropY);
      ctx.drawImage(
        image,
        0, 0, image.naturalWidth, image.naturalHeight,
        0, 0, image.naturalWidth, image.naturalHeight
      );

      // 2. Extract Blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (!b) reject(new Error('Canvas is empty'));
          else resolve(b);
        }, 'image/jpeg', 0.95);
      });

      // 3. Upload Blob
      const formData = new FormData();
      formData.append("image", blob, `cropped-${Date.now()}-${selectedFileName}`);

      const response = await api.post("/api/upload", formData);
      const data = response.data;

      setUploadedFileName(data.filename);
      onImageUpload(data.url);

      toast({
        title: "Image Uploaded",
        description: `Successfully cropped and saved (${Math.round(data.fileSize / 1024)} KB)`,
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.response?.data?.message || "Failed to crop and upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setImgSrc(""); // Cleanup
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading || disabled}
          onClick={() => document.getElementById("image-input")?.click()}
        >
          {isUploading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
          ) : uploadedFileName ? (
            <><Check className="w-4 h-4 mr-2 text-green-600" /> Uploaded</>
          ) : (
            <><Upload className="w-4 h-4 mr-2" /> Upload Image</>
          )}
        </Button>
        <input
          id="image-input"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isUploading || disabled}
          className="hidden"
        />
        {uploadedFileName && <span className="text-xs text-gray-500 break-all">{uploadedFileName}</span>}
      </div>

      <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
        <DialogContent className="max-w-xl flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
            <DialogDescription>
              Adjust the crop area. The image must be a widescreen (16:9) aspect ratio to fit the Chef cards perfectly.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto bg-slate-900/5 rounded-md p-2 flex items-center justify-center min-h-[300px]">
            {!!imgSrc && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                className="max-h-full max-w-full"
              >
                <img
                  ref={imgRef}
                  alt="Crop preview"
                  src={imgSrc}
                  onLoad={onImageLoad}
                  className="max-h-[60vh] object-contain"
                />
              </ReactCrop>
            )}
          </div>

          <DialogFooter className="mt-4 flex-shrink-0 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCropDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={uploadCroppedImage} disabled={!completedCrop?.width || !completedCrop?.height}>
              <Crop className="w-4 h-4 mr-2" />
              Crop & Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
