import { useRef, useState } from 'react';
import { uploadStorageFile } from '../../lib/api';
import type { StorageFileEntry } from '../../lib/types';

interface Props {
  folder?: string;
  accept?: string;
  label?: string;
  onUploaded: (file: StorageFileEntry) => void;
}

/** Drag-and-drop / click-to-browse uploader for the sermon-files bucket. */
export function FileUploader({ folder = '', accept, label = 'Upload file', onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setError('');
    setProgress(0);
    try {
      const uploaded = await uploadStorageFile(file, folder, setProgress);
      onUploaded(uploaded);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${
          dragOver
            ? 'border-forest-600 bg-forest-50'
            : 'border-stone-300 bg-white hover:border-forest-600 hover:bg-forest-50/50'
        }`}
      >
        <svg className="size-8 text-forest-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
        <p className="text-sm font-medium text-forest-700">{label}</p>
        <p className="text-xs text-stone-400">Drag &amp; drop or click to browse · 50 MB max</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      {progress !== null && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full rounded-full bg-gold-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
