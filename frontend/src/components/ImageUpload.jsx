import React, { useState, useRef } from 'react';
import { Upload, X, Image, RefreshCw, AlertCircle } from 'lucide-react';

const ALLOWED_FORMATS = ['JPG', 'JPEG', 'PNG', 'WEBP', 'SVG'];
const FORMAT_MIME = {
  JPG: 'image/jpeg',
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  WEBP: 'image/webp',
  SVG: 'image/svg+xml',
};
const FORMAT_EXT = {
  JPG: ['.jpg', '.jpeg'],
  JPEG: ['.jpg', '.jpeg'],
  PNG: ['.png'],
  WEBP: ['.webp'],
  SVG: ['.svg'],
};

/**
 * ImageUpload — reusable upload component
 * Props:
 *   label (string)
 *   currentImageUrl (string) — existing image to show as preview
 *   onUpload (fn) — called with { file, previewUrl, format } when valid file is selected
 *   onError (fn) — called with error message string
 *   uploadEndpoint (string) — optional: auto-upload to backend
 *   fieldName (string) — form field name for multer (default: 'image')
 *   compact (bool) — compact layout
 */
const ImageUpload = ({
  label = 'Product Image',
  currentImageUrl = '',
  onUpload,
  onError,
  uploadEndpoint = null,
  fieldName = 'image',
  compact = false,
}) => {
  const [selectedFormat, setSelectedFormat] = useState('JPG');
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl || '');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const clearError = () => setError('');

  const validateFile = (file, format) => {
    if (!file) return 'No file selected.';
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const allowedExts = FORMAT_EXT[format] || [];
    const allowedMime = FORMAT_MIME[format];

    if (!allowedExts.includes(ext)) {
      return `Format mismatch: selected ${format} but file is ${ext.toUpperCase()}. Please select the correct format or change the format dropdown.`;
    }
    if (file.type && file.type !== allowedMime && !(format === 'JPG' && file.type === 'image/jpeg')) {
      return `Invalid file type. Expected ${format} image.`;
    }
    if (file.size > 10 * 1024 * 1024) {
      return 'File too large. Maximum size is 10MB.';
    }
    return null;
  };

  const processFile = async (file) => {
    if (!file) return;
    clearError();

    // Auto-detect format from file extension
    const ext = file.name.split('.').pop().toLowerCase();
    const detectedFormat = ext === 'jpg' || ext === 'jpeg' ? 'JPG'
      : ext === 'png' ? 'PNG'
      : ext === 'webp' ? 'WEBP'
      : ext === 'svg' ? 'SVG'
      : selectedFormat;

    setSelectedFormat(detectedFormat);

    const validationError = validateFile(file, detectedFormat);
    if (validationError) {
      setError(validationError);
      if (onError) onError(validationError);
      return;
    }

    // Create local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);

    // If upload endpoint provided, upload immediately
    if (uploadEndpoint) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append(fieldName, file);
        const res = await fetch(uploadEndpoint, { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Upload failed');
        if (onUpload) onUpload({ file, previewUrl: data.imageUrl, format: detectedFormat, serverData: data });
      } catch (err) {
        const msg = err.message || 'Upload failed. Please try again.';
        setError(msg);
        if (onError) onError(msg);
      } finally {
        setUploading(false);
      }
    } else {
      // Return file to parent for deferred upload
      if (onUpload) onUpload({ file, previewUrl: URL.createObjectURL(file), format: detectedFormat });
    }
  };

  const handleFileChange = (e) => {
    processFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setPreviewUrl('');
    setError('');
    if (inputRef.current) inputRef.current.value = '';
    if (onUpload) onUpload({ file: null, previewUrl: '', format: null });
  };

  const acceptStr = '.jpg,.jpeg,.png,.webp,.svg';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          {label}
        </label>
        {/* Format Dropdown */}
        <select
          value={selectedFormat}
          onChange={(e) => setSelectedFormat(e.target.value)}
          className="text-[10px] font-bold rounded-lg px-2 py-1 border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-primary cursor-pointer"
          title="Select image format"
        >
          {ALLOWED_FORMATS.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Upload zone / Preview */}
      {previewUrl ? (
        <div className="upload-preview">
          <img
            src={previewUrl}
            alt="Preview"
            className={compact ? 'h-24 w-24 object-cover rounded-xl border border-[var(--border-color)]' : 'h-40 w-full object-cover rounded-xl border border-[var(--border-color)]'}
            style={{ objectFit: 'cover' }}
            loading="lazy"
          />
          <div className="replace-btn">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 text-gray-800 text-[10px] font-bold rounded-lg hover:bg-white transition-all mr-2"
              disabled={uploading}
            >
              <RefreshCw size={11} />
              Replace
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1 px-2 py-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-lg hover:bg-rose-600 transition-all"
            >
              <X size={11} />
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div
          className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-primary font-medium">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 pointer-events-none">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Upload size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">
                  Click to upload or drag & drop
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                  {ALLOWED_FORMATS.join(', ')} · Max 10MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={acceptStr}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Error display */}
      {error && (
        <div className="flex items-start gap-1.5 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
          <AlertCircle size={12} className="text-rose-500 mt-0.5 shrink-0" />
          <span className="text-[10px] text-rose-500 font-medium leading-snug">{error}</span>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
