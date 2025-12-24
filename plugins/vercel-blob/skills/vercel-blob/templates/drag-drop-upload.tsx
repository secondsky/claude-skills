'use client';

// Drag & Drop File Upload Component for Vercel Blob
// Complete component with progress tracking, file preview, and error handling

import { useState, useCallback } from 'react';
import { upload } from '@vercel/blob/client';

interface UploadedFile {
  url: string;
  pathname: string;
  name: string;
  size: number;
}

export function DragDropUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);

  // File validation
  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

    if (file.size > maxSize) {
      return `File too large. Max size: 10MB`;
    }

    if (!allowedTypes.includes(file.type)) {
      return `Invalid file type. Allowed: JPEG, PNG, WebP, GIF, PDF`;
    }

    return null;
  };

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  // Handle file selection
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  }, []);

  const handleFiles = (newFiles: File[]) => {
    const validFiles: File[] = [];
    const newErrors: Record<string, string> = {};

    newFiles.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        newErrors[file.name] = error;
      } else {
        validFiles.push(file);
      }
    });

    setFiles((prev) => [...prev, ...validFiles]);
    setErrors((prev) => ({ ...prev, ...newErrors }));
  };

  // Remove file from list
  const removeFile = (fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fileName];
      return newErrors;
    });
  };

  // Upload files
  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    const newUploadedFiles: UploadedFile[] = [];

    for (const file of files) {
      try {
        // Update progress
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

        // Get upload token from server
        const tokenResponse = await fetch('/api/upload-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name })
        });

        if (!tokenResponse.ok) {
          throw new Error('Failed to get upload token');
        }

        const { url: handleUploadUrl } = await tokenResponse.json();

        // Upload file
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl,
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            setUploadProgress((prev) => ({ ...prev, [file.name]: progress }));
          }
        });

        newUploadedFiles.push({
          url: blob.url,
          pathname: blob.pathname,
          name: file.name,
          size: file.size
        });

        // Mark complete
        setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        setErrors((prev) => ({
          ...prev,
          [file.name]: error instanceof Error ? error.message : 'Upload failed'
        }));
      }
    }

    setUploadedFiles((prev) => [...prev, ...newUploadedFiles]);
    setFiles([]);
    setIsUploading(false);
    setUploadProgress({});
  };

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Upload Files</h2>

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
        `}
      >
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
          id="file-input"
          accept="image/*,application/pdf"
        />

        <label htmlFor="file-input" className="cursor-pointer">
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg text-gray-600">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Max 10MB · JPEG, PNG, WebP, GIF, PDF
            </p>
          </div>
        </label>
      </div>

      {/* Selected Files List */}
      {files.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="font-semibold">Selected Files ({files.length})</h3>
          {files.map((file) => (
            <div key={file.name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex-1">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">{formatSize(file.size)}</p>

                {/* Progress bar */}
                {uploadProgress[file.name] !== undefined && (
                  <div className="mt-2">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${uploadProgress[file.name]}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{uploadProgress[file.name]}%</p>
                  </div>
                )}

                {/* Error message */}
                {errors[file.name] && (
                  <p className="text-xs text-red-500 mt-1">{errors[file.name]}</p>
                )}
              </div>

              <button
                onClick={() => removeFile(file.name)}
                disabled={isUploading}
                className="ml-4 text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          <button
            onClick={handleUpload}
            disabled={isUploading || files.length === 0}
            className="mt-4 w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-8 space-y-2">
          <h3 className="font-semibold">Uploaded Files ({uploadedFiles.length})</h3>
          {uploadedFiles.map((file) => (
            <div key={file.url} className="flex items-center justify-between p-3 bg-green-50 rounded">
              <div className="flex-1">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline"
                >
                  View file
                </a>
              </div>
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SERVER: API Route for Upload Token
// ============================================================================

// app/api/upload-token/route.ts
/*
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Validate user is authenticated
        // const session = await getSession();
        // if (!session) throw new Error('Unauthorized');

        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
          maximumSizeInBytes: 10 * 1024 * 1024, // 10MB
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Optional: Save to database
        console.log('Upload completed:', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
*/
