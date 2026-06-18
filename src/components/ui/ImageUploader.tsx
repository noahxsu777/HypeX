'use client';
import { useRef, useState, useCallback } from 'react';
import { Camera, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from './LoadingSpinner';

interface ImageUploaderProps {
  onUpload: (url: string) => void;
  folder?: string;
  accept?: string;
  multiple?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export default function ImageUploader({
  onUpload,
  folder = 'posts',
  accept = 'image/*,video/*',
  multiple = false,
  children,
  className,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const uploadFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const ext = file.name.split('.').pop() ?? 'bin';
        const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const path = `${folder}/${Date.now()}-${safeName}`;
        const { data, error: uploadError } = await supabase.storage
          .from('media')
          .upload(path, file);
        if (uploadError) throw uploadError;
        const {
          data: { publicUrl },
        } = supabase.storage.from('media').getPublicUrl(data.path);
        onUpload(publicUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al subir archivo');
      } finally {
        setLoading(false);
      }
    },
    [folder, onUpload]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      Array.from(files).forEach(uploadFile);
    },
    [uploadFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const trigger = () => inputRef.current?.click();

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="sr-only"
        aria-hidden="true"
      />

      <div
        role="button"
        tabIndex={0}
        onClick={trigger}
        onKeyDown={(e) => e.key === 'Enter' && trigger()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(dragActive && 'drag-active')}
        aria-label="Subir archivo"
      >
        {children ?? (
          <div
            className={cn(
              'flex flex-col items-center justify-center gap-3 p-8',
              'border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl',
              'cursor-pointer transition-colors',
              'hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20',
              dragActive && 'drag-active'
            )}
          >
            {loading ? (
              <LoadingSpinner size={32} className="text-purple-500" />
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  {dragActive ? (
                    <Upload size={24} className="text-purple-500" />
                  ) : (
                    <Camera size={24} className="text-gray-400 dark:text-gray-500" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {dragActive ? 'Suelta el archivo aquí' : 'Toca para subir'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    o arrastra y suelta
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Overlay spinner when children provided and uploading */}
      {children && loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
          <LoadingSpinner size={28} className="text-white" />
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-xs text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
