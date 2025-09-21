import { useState } from "react";

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export function useImageUpload(uploadUrl: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (uri: string, fileName?: string, mimeType?: string): Promise<UploadResult> => {
    try {
      setLoading(true);
      setError(null);

      // fallback values
      const name = fileName || `upload_${Date.now()}.${mimeType?.split("/")[1] || "jpg"}`;
      const type = mimeType || "image/jpeg";

      const formData = new FormData();
      formData.append("file", {
        uri,
        name,
        type,
      } as any);

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "Upload failed");
      }

      return { success: true, url: json.url };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { uploadImage, loading, error };
}
