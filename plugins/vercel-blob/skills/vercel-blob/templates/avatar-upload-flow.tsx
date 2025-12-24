'use client';

// Complete Avatar Upload Flow for Vercel Blob
// Includes image preview, crop preview (optional), upload, and update

import { useState, useRef } from 'react';
import { put, del } from '@vercel/blob';

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string;
  onAvatarUpdate?: (url: string) => void;
}

export function AvatarUploadFlow({ userId, currentAvatarUrl, onAvatarUpdate }: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl || '');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate image file
  const validateImage = (file: File): string | null => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return 'Only JPEG, PNG, and WebP images are allowed';
    }

    if (file.size > maxSize) {
      return 'Image must be smaller than 5MB';
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validationError = validateImage(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFile(selectedFile);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  // Handle upload
  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError('');

    try {
      // Delete old avatar if exists
      if (avatarUrl) {
        try {
          await del(avatarUrl);
        } catch (err) {
          console.error('Failed to delete old avatar:', err);
          // Continue with upload even if delete fails
        }
      }

      // Upload new avatar
      const blob = await put(`avatars/${userId}.jpg`, file, {
        access: 'public',
        contentType: file.type,
        addRandomSuffix: false  // Always use same filename for user
      });

      setAvatarUrl(blob.url);
      setPreviewUrl('');
      setFile(null);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Callback to parent
      if (onAvatarUpdate) {
        onAvatarUpdate(blob.url);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Cancel preview
  const handleCancel = () => {
    setFile(null);
    setPreviewUrl('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Trigger file input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Profile Picture</h2>

      <div className="space-y-4">
        {/* Current or Preview Avatar */}
        <div className="relative w-48 h-48 mx-auto">
          <div className="w-full h-full rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {previewUrl || avatarUrl ? (
              <img
                src={previewUrl || avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <svg className="w-24 h-24 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </div>

          {/* Edit overlay */}
          {!previewUrl && (
            <button
              onClick={triggerFileInput}
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 hover:opacity-100 transition-opacity"
            >
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {error}
          </div>
        )}

        {/* File info */}
        {file && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-gray-600">
              {(file.size / 1024).toFixed(1)} KB · {file.type}
            </p>
          </div>
        )}

        {/* Action buttons */}
        {previewUrl ? (
          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload Avatar'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isUploading}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={triggerFileInput}
            className="w-full py-2 px-4 border border-gray-300 rounded hover:bg-gray-50"
          >
            {avatarUrl ? 'Change Picture' : 'Upload Picture'}
          </button>
        )}

        {/* Current avatar URL */}
        {avatarUrl && !previewUrl && (
          <div className="text-xs text-gray-500 break-all">
            <a href={avatarUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
              View full size →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SERVER ACTION VERSION (Next.js Server Actions)
// ============================================================================

/*
'use server';

import { put, del } from '@vercel/blob';
import { revalidatePath } from 'next/cache';

export async function updateAvatar(userId: string, formData: FormData) {
  const file = formData.get('avatar') as File;
  const currentAvatarUrl = formData.get('currentAvatarUrl') as string;

  if (!file) {
    throw new Error('No file provided');
  }

  // Validate
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File too large (max 5MB)');
  }

  // Delete old avatar
  if (currentAvatarUrl) {
    try {
      await del(currentAvatarUrl);
    } catch (error) {
      console.error('Failed to delete old avatar:', error);
    }
  }

  // Upload new avatar
  const blob = await put(`avatars/${userId}.jpg`, file, {
    access: 'public',
    contentType: file.type,
    addRandomSuffix: false
  });

  // Update database
  await db.update(users).set({ avatarUrl: blob.url }).where(eq(users.id, userId));

  revalidatePath('/profile');

  return blob.url;
}
*/

// ============================================================================
// CLIENT COMPONENT USING SERVER ACTION
// ============================================================================

/*
'use client';

import { useState } from 'react';
import { updateAvatar } from './actions';

export function AvatarUploadWithServerAction({ userId, currentAvatarUrl }: Props) {
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl || '');
  const [previewUrl, setPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(formData: FormData) {
    setIsUploading(true);
    setError('');

    try {
      formData.append('currentAvatarUrl', avatarUrl);
      const newUrl = await updateAvatar(userId, formData);
      setAvatarUrl(newUrl);
      setPreviewUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form action={handleSubmit}>
      <input type="file" name="avatar" accept="image/*" required />
      <button type="submit" disabled={isUploading}>
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  );
}
*/

// ============================================================================
// WITH IMAGE OPTIMIZATION (Sharp)
// ============================================================================

/*
// Server-side optimization before upload
import sharp from 'sharp';

export async function uploadOptimizedAvatar(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());

  // Resize and optimize
  const optimized = await sharp(buffer)
    .resize(400, 400, {
      fit: 'cover',
      position: 'center'
    })
    .jpeg({ quality: 85 })
    .toBuffer();

  // Upload optimized version
  const blob = await put(`avatars/${userId}.jpg`, optimized, {
    access: 'public',
    contentType: 'image/jpeg'
  });

  return blob.url;
}
*/
