import { useState } from "react";
import api from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, Check } from "lucide-react";

interface ImageUploaderProps {
  onImageUpload: (url: string) => void;
  disabled?: boolean;
}

export function ImageUploader({ onImageUpload, disabled = false }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>();
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only JPEG, PNG, WebP, and GIF images are allowed",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5 MB",
        variant: "destructive",
      });
      return;
    }

    // Upload file
    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      // axios automatically detects and sets proper multipart/form-data header with boundary
      // DO NOT manually set Content-Type header - let axios handle it
      const response = await api.post("/api/upload", formData);

      const data = response.data;
      setUploadedFileName(data.filename);
      onImageUpload(data.url); // Pass the URL back to form

      toast({
        title: "Image uploaded",
        description: `${data.filename} (${Math.round(data.fileSize / 1024)} KB)`,
      });

      // Reset file input
      if (event.target) {
        event.target.value = "";
      }
    } catch (error: any) {
      console.error("Upload error:", error.response?.data || error.message);
      toast({
        title: "Upload failed",
        description: error.response?.data?.message || error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    const input = document.getElementById("image-input") as HTMLInputElement;
    input?.click();
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isUploading || disabled}
        className="cursor-pointer"
        onClick={handleButtonClick}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : uploadedFileName ? (
          <>
            <Check className="w-4 h-4 mr-2 text-green-600" />
            Uploaded
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Upload Image
          </>
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
      {uploadedFileName && <span className="text-xs text-gray-500">{uploadedFileName}</span>}
    </div>
  );
}
