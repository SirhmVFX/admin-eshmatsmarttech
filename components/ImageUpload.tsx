'use client';

import { useState, useRef, useCallback } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';

const MAX_SIZE = 8 * 1024 * 1024; // 8MB
const ACCEPTED = 'image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml,image/avif';

interface Props {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  aspectRatio?: string; // e.g. '16/9', '1/1', '4/3'
  height?: number;
}

export default function ImageUpload({ value, onChange, folder = 'uploads', label = 'Image', aspectRatio, height = 160 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file: File) => {
    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Only image files are accepted.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError(`File too large. Max size is 8MB (this file is ${(file.size / 1024 / 1024).toFixed(1)}MB).`);
      return;
    }

    setUploading(true);
    setProgress(0);

    const ext = file.name.split('.').pop() ?? 'jpg';
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const storageRef = ref(storage, filename);
    const task = uploadBytesResumable(storageRef, file, { contentType: file.type });

    task.on(
      'state_changed',
      snap => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      err => { setError(`Upload failed: ${err.message}`); setUploading(false); },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        onChange(url);
        setUploading(false);
        setProgress(0);
      }
    );
  }, [folder, onChange]);

  const handleFile = (file: File | undefined) => { if (file) upload(file); };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleRemove = async () => {
    if (!value) return;
    // Try to delete from storage if it's a Firebase URL
    if (value.includes('firebasestorage.googleapis.com')) {
      try {
        const storageRef = ref(storage, value);
        await deleteObject(storageRef);
      } catch { /* ignore if already deleted */ }
    }
    onChange('');
  };

  return (
    <div>
      {label && <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>{label}</label>}

      {value ? (
        /* Preview */
        <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Uploaded" style={{ width: '100%', height, objectFit: 'cover', borderRadius: 5, display: 'block', border: '1px solid var(--border2)' }} />
          <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 5 }}>
            <button type="button" onClick={() => inputRef.current?.click()}
              style={{ background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
              Replace
            </button>
            <button type="button" onClick={handleRemove}
              style={{ background: 'rgba(239,68,68,0.85)', border: 'none', color: '#fff', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        /* Drop zone */
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--gold)' : 'var(--border2)'}`,
            borderRadius: 5,
            height,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: uploading ? 'not-allowed' : 'pointer',
            background: dragging ? 'rgba(201,168,76,0.05)' : 'var(--bg3)',
            transition: 'all 0.15s',
          }}>
          {uploading ? (
            <>
              <div style={{ fontSize: 22, color: 'var(--gold)' }}>⬆</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Uploading... {progress}%</div>
              <div style={{ width: '60%', height: 3, background: 'var(--border2)', borderRadius: 2 }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--gold)', borderRadius: 2, transition: 'width 0.2s' }} />
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 28, color: 'var(--subtle)' }}>🖼</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
                <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Click to upload</span> or drag & drop
              </div>
              <div style={{ fontSize: 10, color: 'var(--subtle)' }}>JPG, PNG, WebP, GIF, SVG, AVIF · Max 8MB</div>
            </>
          )}
        </div>
      )}

      {error && (
        <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 5, background: 'rgba(239,68,68,0.08)', padding: '6px 10px', borderRadius: 4 }}>
          {error}
        </div>
      )}

      <input ref={inputRef} type="file" accept={ACCEPTED} style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files?.[0])} />
    </div>
  );
}

// ── Multi-image upload ─────────────────────────────────────────────────────

interface MultiProps {
  values: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  label?: string;
  max?: number;
}

export function MultiImageUpload({ values, onChange, folder = 'uploads', label = 'Images', max = 10 }: MultiProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setError('');
    if (!file.type.startsWith('image/')) { setError('Only image files are accepted.'); return; }
    if (file.size > MAX_SIZE) { setError(`File too large. Max 8MB.`); return; }
    if (values.length >= max) { setError(`Maximum ${max} images allowed.`); return; }

    setUploading(true);
    const ext = file.name.split('.').pop() ?? 'jpg';
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const storageRef = ref(storage, filename);
    const task = uploadBytesResumable(storageRef, file, { contentType: file.type });

    task.on(
      'state_changed',
      snap => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      err => { setError(`Upload failed: ${err.message}`); setUploading(false); },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        onChange([...values, url]);
        setUploading(false);
        setProgress(0);
      }
    );
  };

  const remove = async (idx: number) => {
    const url = values[idx];
    if (url.includes('firebasestorage.googleapis.com')) {
      try { await deleteObject(ref(storage, url)); } catch { /* ignore */ }
    }
    onChange(values.filter((_, i) => i !== idx));
  };

  return (
    <div>
      {label && <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>{label}</label>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: values.length > 0 ? 10 : 0 }}>
        {values.map((url, i) => (
          <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border2)' }} />
            <button type="button" onClick={() => remove(i)}
              style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: 'var(--red)', border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              ×
            </button>
          </div>
        ))}

        {values.length < max && (
          <div onClick={() => !uploading && inputRef.current?.click()}
            style={{ width: 80, height: 80, border: '2px dashed var(--border2)', borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: uploading ? 'not-allowed' : 'pointer', background: 'var(--bg3)', gap: 3 }}>
            {uploading ? (
              <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center' }}>{progress}%</div>
            ) : (
              <>
                <span style={{ fontSize: 18, color: 'var(--subtle)' }}>+</span>
                <span style={{ fontSize: 9, color: 'var(--subtle)' }}>Add</span>
              </>
            )}
          </div>
        )}
      </div>

      {error && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>{error}</div>}
      <input ref={inputRef} type="file" accept={ACCEPTED} style={{ display: 'none' }}
        onChange={e => { if (e.target.files?.[0]) upload(e.target.files[0]); e.target.value = ''; }} />
    </div>
  );
}
