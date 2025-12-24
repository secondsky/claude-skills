'use client';

// File List Manager for Vercel Blob
// Display uploaded files with delete and download actions

import { useState, useEffect } from 'react';
import { list, del, type ListBlobResult } from '@vercel/blob';

interface BlobFile {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
}

export function FileListManager({ prefix = '' }: { prefix?: string }) {
  const [files, setFiles] = useState<BlobFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);

  // Load files
  const loadFiles = async (loadMore = false) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/files?prefix=${prefix}&cursor=${cursor || ''}`);

      if (!response.ok) {
        throw new Error('Failed to load files');
      }

      const data: { blobs: BlobFile[]; cursor?: string; hasMore: boolean } = await response.json();

      if (loadMore) {
        setFiles((prev) => [...prev, ...data.blobs]);
      } else {
        setFiles(data.blobs);
      }

      setCursor(data.cursor);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Failed to load files:', err);
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadFiles();
  }, [prefix]);

  // Delete file
  const handleDelete = async (url: string, pathname: string) => {
    if (!confirm(`Delete ${pathname}?`)) return;

    setDeletingFiles((prev) => new Set(prev).add(url));

    try {
      const response = await fetch('/api/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      // Remove from list
      setFiles((prev) => prev.filter((f) => f.url !== url));
    } catch (err) {
      console.error('Failed to delete file:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete file');
    } finally {
      setDeletingFiles((prev) => {
        const next = new Set(prev);
        next.delete(url);
        return next;
      });
    }
  };

  // Download file
  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  // Get file icon
  const getFileIcon = (pathname: string) => {
    const ext = pathname.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return (
        <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      );
    }

    if (ext === 'pdf') {
      return (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    }

    return (
      <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Files</h2>
        <button
          onClick={() => loadFiles()}
          disabled={isLoading}
          className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-600">
          {error}
        </div>
      )}

      {files.length === 0 && !isLoading && (
        <div className="text-center py-12 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p className="mt-2">No files uploaded yet</p>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => {
            const isDeleting = deletingFiles.has(file.url);
            const filename = file.pathname.split('/').pop() || file.pathname;

            return (
              <div
                key={file.url}
                className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded hover:bg-gray-50"
              >
                {/* File icon */}
                <div className="flex-shrink-0">
                  {getFileIcon(file.pathname)}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{filename}</p>
                  <p className="text-sm text-gray-500">
                    {formatSize(file.size)} · {formatDate(file.uploadedAt)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.open(file.url, '_blank')}
                    className="p-2 text-gray-600 hover:text-gray-900"
                    title="View"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleDownload(file.url, filename)}
                    className="p-2 text-gray-600 hover:text-gray-900"
                    title="Download"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleDelete(file.url, filename)}
                    disabled={isDeleting}
                    className="p-2 text-red-600 hover:text-red-900 disabled:opacity-50"
                    title="Delete"
                  >
                    {isDeleting ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <button
          onClick={() => loadFiles(true)}
          disabled={isLoading}
          className="mt-4 w-full py-2 px-4 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// SERVER: API Route for List & Delete
// ============================================================================

// app/api/files/route.ts
/*
import { list, del } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const prefix = searchParams.get('prefix') || '';
  const cursor = searchParams.get('cursor') || undefined;

  try {
    const { blobs, cursor: nextCursor, hasMore } = await list({
      prefix,
      limit: 20,
      cursor
    });

    return NextResponse.json({
      blobs: blobs.map(blob => ({
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt
      })),
      cursor: nextCursor,
      hasMore
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    await del(url);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
*/
