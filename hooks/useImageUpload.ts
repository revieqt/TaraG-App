import { useState } from "react";

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export function useImageUpload(uploadUrl: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (uri: string, userID: string, accessToken: string): Promise<UploadResult> => {
    try {
      setLoading(true);
      setError(null);

      const name = `profile_${userID}_${Date.now()}.jpg`;
      const type = "image/jpeg";

      const formData = new FormData();
      formData.append("image", {
        uri,
        name,
        type,
      } as any);
      formData.append("userID", userID);

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "Upload failed");
      }

      return { success: true, url: json.imageUrl };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { uploadImage, loading, error };
}
