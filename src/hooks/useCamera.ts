import { useState, useRef, useCallback } from "react";

export function useCamera() {
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const capturePhoto = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoDataUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const clearPhoto = useCallback(() => {
    setPhotoDataUrl(null);
    setPhotoFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

  return {
    photoDataUrl,
    photoFile,
    inputRef,
    capturePhoto,
    handleFileChange,
    clearPhoto,
  };
}
