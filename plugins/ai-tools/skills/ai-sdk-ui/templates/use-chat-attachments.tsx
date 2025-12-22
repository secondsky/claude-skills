/**
 * AI SDK UI - Chat with File Attachments
 *
 * Demonstrates:
 * - File upload with experimental_attachments
 * - Image preview
 * - Multiple file support
 * - Sending files with messages
 *
 * Requires:
 * - API route that handles multimodal inputs (GPT-4 Vision, Claude 3.5, etc.)
 * - experimental_attachments feature (v5)
 *
 * Usage:
 * 1. Set up API route with vision model
 * 2. Copy this component
 * 3. Customize file handling as needed
 */

'use client';

import { useChat } from 'ai/react';
import { useState, FormEvent, useRef, useEffect } from 'react';

export default function ChatWithAttachments() {
  const { messages, append, isLoading, error } = useChat({
    api: '/api/chat',
  });
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const createdUrls = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    setFiles(selectedFiles);

    if (selectedFiles) {
      // ✅ FIXED: Revoke old URLs before creating new ones to prevent memory leak
      createdUrls.current.forEach((url) => URL.revokeObjectURL(url));
      createdUrls.current = [];

      // Create preview URLs and track them
      const urls = Array.from(selectedFiles).map((file) => {
        const url = URL.createObjectURL(file);
        createdUrls.current.push(url);
        return url;
      });
      setPreviewUrls(urls);
    } else {
      // Revoke URLs when clearing selection
      createdUrls.current.forEach((url) => URL.revokeObjectURL(url));
      createdUrls.current = [];
      setPreviewUrls([]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !files) return;

    // Reuse preview URLs for attachments (don't create new ones)
    const attachments = files
      ? Array.from(files).map((file, index) => ({
          name: file.name,
          contentType: file.type,
          url: previewUrls[index], // Reuse existing URLs
        }))
      : undefined;

    // Send message with attachments
    await append({
      role: 'user',
      content: input || 'Please analyze these images',
      experimental_attachments: attachments,
    });

    // Now that message is sent, revoke URLs and clean up
    // ✅ FIX: Revoke from ref (source of truth) not state to prevent memory leak
    createdUrls.current.forEach((url) => URL.revokeObjectURL(url));
    createdUrls.current = [];

    // Clear state
    setInput('');
    setFiles(null);
    setPreviewUrls([]);

    // Clear file input element
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove file
  const removeFile = (index: number) => {
    if (!files) return;

    const newFiles = Array.from(files).filter((_, i) => i !== index);
    const dataTransfer = new DataTransfer();
    newFiles.forEach((file) => dataTransfer.items.add(file));

    setFiles(dataTransfer.files);

    // Update preview URLs
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));

    // ✅ FIX: Sync createdUrls.current ref to prevent memory leak
    // Remove the URL from the ref to keep it in sync with previewUrls state
    if (createdUrls.current && createdUrls.current[index]) {
      createdUrls.current = createdUrls.current.filter((_, i) => i !== index);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Revoke any remaining URLs when component unmounts
      createdUrls.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      {/* Header */}
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">AI Chat with File Attachments</h1>
        <p className="text-sm text-gray-600">
          Upload images and ask questions about them
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            {/* Text content */}
            <div
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                {message.content}
              </div>
            </div>

            {/* Attachments */}
            {message.experimental_attachments &&
              message.experimental_attachments.length > 0 && (
                <div
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className="grid grid-cols-2 gap-2 max-w-[70%]">
                    {message.experimental_attachments.map(
                      (attachment, idx) => (
                        <div key={idx} className="relative">
                          {attachment.contentType?.startsWith('image/') ? (
                            <img
                              src={attachment.url}
                              alt={attachment.name}
                              className="rounded-lg max-h-40 object-cover"
                            />
                          ) : (
                            <div className="p-2 bg-gray-100 rounded-lg text-sm">
                              {attachment.name}
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 p-3 rounded-lg">Processing...</div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border-t border-red-200 text-red-700">
          <strong>Error:</strong> {error.message}
        </div>
      )}

      {/* File preview */}
      {previewUrls.length > 0 && (
        <div className="p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-700 mb-2">
            Selected files ({previewUrls.length}):
          </p>
          <div className="grid grid-cols-4 gap-2">
            {previewUrls.map((url, idx) => (
              <div key={idx} className="relative">
                <img
                  src={url}
                  alt={`Preview ${idx + 1}`}
                  className="rounded-lg h-20 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="space-y-2">
          {/* File input */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <div className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
              📎 Attach Files
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {files && <span className="text-sm text-gray-600">{files.length} file(s)</span>}
          </label>

          {/* Text input */}
          <div className="flex space-x-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about the images..."
              disabled={isLoading}
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !files)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
