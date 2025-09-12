'use client';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

export function ImageDropzone({ onFileAccepted }: { onFileAccepted: (file: File) => void }) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      onFileAccepted(file);
      setPreview(URL.createObjectURL(file));
    }
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.gif', '.webp'] },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className="p-8 mt-2 border-2 border-dashed rounded-lg cursor-pointer text-center text-gray-500 hover:border-blue-500"
    >
      <input {...getInputProps()} />
      {preview ? (
        <img src={preview} alt="Upload preview" className="max-h-48 mx-auto rounded-md" />
      ) : isDragActive ? (
        <p>Drop the image here...</p>
      ) : (
        <p>Drag & drop an image here, or click to select a file</p>
      )}
    </div>
  );
}