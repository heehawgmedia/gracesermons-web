import { useCallback, useEffect, useState } from 'react';
import { deleteStorageFile, formatFileSize, listStorageFiles } from '../../lib/api';
import type { StorageFileEntry } from '../../lib/types';
import { FileUploader } from './FileUploader';
import { DangerButton } from './forms';

const FOLDERS = ['', 'audio', 'covers'];

export function FilesAdmin() {
  const [folder, setFolder] = useState('audio');
  const [files, setFiles] = useState<StorageFileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    listStorageFiles(folder)
      .then(setFiles)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [folder]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (file: StorageFileEntry) => {
    if (!window.confirm(`Delete ${file.name}? Sermons pointing at it will stop playing.`)) return;
    try {
      await deleteStorageFile(file.path);
      load();
    } catch (e) {
      window.alert((e as Error).message);
    }
  };

  const copyUrl = async (file: StorageFileEntry) => {
    try {
      await navigator.clipboard.writeText(file.publicUrl);
      setCopied(file.path);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      window.prompt('Copy URL:', file.publicUrl);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-forest-800">File Library</h2>
        <select
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
          className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm outline-none focus:border-forest-600"
        >
          {FOLDERS.map((f) => (
            <option key={f} value={f}>
              {f === '' ? 'Bucket root' : `${f}/`}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5">
        <FileUploader
          folder={folder}
          label={`Upload to ${folder || 'bucket root'}`}
          onUploaded={load}
        />
      </div>

      {loading && <p className="py-10 text-center text-sm text-stone-400">Loading files…</p>}
      {error && <p className="py-10 text-center text-sm text-red-600">{error}</p>}
      {!loading && !error && (
        <ul className="mt-5 divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          {files.map((file) => (
            <li key={file.path} className="flex items-center gap-3 px-4 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-forest-50 text-forest-700">
                {file.mimeType.startsWith('audio/') ? (
                  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                  </svg>
                ) : file.mimeType.startsWith('image/') ? (
                  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z" />
                  </svg>
                ) : (
                  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" />
                  </svg>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{file.name}</span>
                <span className="block text-xs text-stone-500">{formatFileSize(file.size)}</span>
              </span>
              <button
                onClick={() => void copyUrl(file)}
                className="text-sm font-medium text-forest-600 hover:underline"
              >
                {copied === file.path ? 'Copied!' : 'Copy URL'}
              </button>
              <DangerButton onClick={() => void remove(file)}>Delete</DangerButton>
            </li>
          ))}
          {files.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-stone-400">
              No files in this folder yet.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
