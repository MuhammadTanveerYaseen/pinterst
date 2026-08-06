'use client';

import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, Link2, X, Image as ImageIcon, CheckCircle2, Loader } from 'lucide-react';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
}

type Mode = 'idle' | 'url' | 'dragging' | 'uploading' | 'success' | 'error';

export default function ImageUploader({ value, onChange, placeholder, className }: ImageUploaderProps) {
  const [mode, setMode] = useState<Mode>('idle');
  const [urlInput, setUrlInput] = useState(value || '');
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, GIF, WEBP).');
      setMode('error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image is too large. Maximum size is 10MB.');
      setMode('error');
      return;
    }

    setMode('uploading');
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate progress
      let prog = 0;
      const interval = setInterval(() => {
        prog = Math.min(prog + 15, 85);
        setUploadProgress(prog);
      }, 100);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);
      setUploadProgress(100);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      const data = await res.json();
      onChange(data.url);
      setMode('success');
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
      setMode('error');
    }
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setMode('dragging');
  };

  const handleDragLeave = () => {
    if (mode === 'dragging') setMode('idle');
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;
    try {
      new URL(urlInput);
      onChange(urlInput.trim());
      setMode('success');
    } catch {
      setError('Please enter a valid URL.');
    }
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
    setMode('idle');
    setError('');
    setUploadProgress(0);
  };

  const hasImage = !!value;

  return (
    <div className={`space-y-2 ${className || ''}`}>
      {/* Image preview if exists */}
      {hasImage && (
        <div className="relative rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 group">
          <img
            src={value}
            alt="Uploaded"
            className="w-full h-40 object-cover"
            onError={() => { setError('Failed to load image URL.'); }}
          />
          <div className="absolute inset-0 bg-neutral-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={handleClear}
              className="bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-red-700 transition-colors"
            >
              <X className="w-3 h-3" /> Remove Image
            </button>
          </div>
          <div className="absolute top-2 right-2">
            <span className="bg-emerald-500/90 text-white text-xxs font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Ready
            </span>
          </div>
        </div>
      )}

      {/* Upload Zone (shown only when no image) */}
      {!hasImage && (
        <>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed cursor-pointer
              transition-all duration-200 min-h-[130px]
              ${mode === 'dragging'
                ? 'border-red-500 bg-red-500/5'
                : mode === 'uploading'
                ? 'border-purple-500 bg-purple-500/5 cursor-not-allowed'
                : mode === 'error'
                ? 'border-red-400 bg-red-500/5'
                : 'border-neutral-300 dark:border-neutral-700 hover:border-red-500/60 hover:bg-red-500/5 dark:hover:border-red-500/40 bg-neutral-50 dark:bg-neutral-950'
              }
            `}
          >
            {mode === 'uploading' ? (
              <div className="flex flex-col items-center gap-3 w-full px-4">
                <Loader className="w-8 h-8 text-purple-500 animate-spin" />
                <span className="text-xs text-neutral-500">Uploading... {uploadProgress}%</span>
                <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className={`p-3 rounded-xl ${mode === 'dragging' ? 'bg-red-500/10 text-red-500' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400'}`}>
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    {mode === 'dragging' ? 'Drop image here' : 'Drag & drop an image'}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    or <span className="text-red-500 font-semibold">click to browse</span> — JPEG, PNG, GIF, WEBP · max 10MB
                  </p>
                </div>
              </>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
              onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
              className="sr-only"
            />
          </div>

          {/* URL alternative */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
            <span className="text-xxs text-neutral-400 font-semibold uppercase tracking-wider">or paste URL</span>
            <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                <Link2 className="w-4 h-4" />
              </span>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleUrlSubmit(); } }}
                placeholder={placeholder || 'https://example.com/image.jpg'}
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
              />
            </div>
            <button
              type="button"
              onClick={handleUrlSubmit}
              disabled={!urlInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-40 transition-all"
            >
              Use URL
            </button>
          </div>
        </>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <X className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}
