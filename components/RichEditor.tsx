'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  folder?: string;
}

type ToolbarAction =
  | 'bold' | 'italic' | 'underline' | 'strikeThrough'
  | 'h1' | 'h2' | 'h3'
  | 'insertUnorderedList' | 'insertOrderedList'
  | 'blockquote' | 'code'
  | 'justifyLeft' | 'justifyCenter' | 'justifyRight'
  | 'createLink' | 'insertImage' | 'insertHorizontalRule'
  | 'undo' | 'redo' | 'removeFormat';

export default function RichEditor({ value, onChange, placeholder = 'Start writing...', minHeight = 300, folder = 'blog' }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const isInternalChange = useRef(false);

  // Sync value → editor (only on mount or external change)
  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      isInternalChange.current = true;
      editorRef.current.innerHTML = value || '';
      isInternalChange.current = false;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (!editorRef.current || isInternalChange.current) return;
    onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const exec = useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  const handleAction = useCallback((action: ToolbarAction) => {
    switch (action) {
      case 'h1': exec('formatBlock', '<h1>'); break;
      case 'h2': exec('formatBlock', '<h2>'); break;
      case 'h3': exec('formatBlock', '<h3>'); break;
      case 'blockquote': exec('formatBlock', '<blockquote>'); break;
      case 'code': exec('formatBlock', '<pre>'); break;
      case 'createLink': {
        const url = prompt('Enter URL:');
        if (url) exec('createLink', url);
        break;
      }
      case 'insertImage': imgInputRef.current?.click(); break;
      default: exec(action); break;
    }
  }, [exec]);

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 8 * 1024 * 1024) { alert('Image must be under 8MB'); return; }
    setUploading(true);
    const ext = file.name.split('.').pop() ?? 'jpg';
    const filename = `${folder}/${Date.now()}.${ext}`;
    const storageRef = ref(storage, filename);
    const task = uploadBytesResumable(storageRef, file, { contentType: file.type });
    task.on('state_changed', null,
      () => setUploading(false),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        exec('insertImage', url);
        setUploading(false);
      }
    );
  };

  const isActive = (cmd: string) => {
    try { return document.queryCommandState(cmd); } catch { return false; }
  };

  const TOOLBAR: { icon: string; action: ToolbarAction; title: string; cmd?: string }[][] = [
    [
      { icon: 'B', action: 'bold', title: 'Bold', cmd: 'bold' },
      { icon: 'I', action: 'italic', title: 'Italic', cmd: 'italic' },
      { icon: 'U', action: 'underline', title: 'Underline', cmd: 'underline' },
      { icon: 'S̶', action: 'strikeThrough', title: 'Strikethrough', cmd: 'strikeThrough' },
    ],
    [
      { icon: 'H1', action: 'h1', title: 'Heading 1' },
      { icon: 'H2', action: 'h2', title: 'Heading 2' },
      { icon: 'H3', action: 'h3', title: 'Heading 3' },
    ],
    [
      { icon: '≡', action: 'insertUnorderedList', title: 'Bullet list', cmd: 'insertUnorderedList' },
      { icon: '1.', action: 'insertOrderedList', title: 'Numbered list', cmd: 'insertOrderedList' },
      { icon: '❝', action: 'blockquote', title: 'Blockquote' },
      { icon: '</>', action: 'code', title: 'Code block' },
    ],
    [
      { icon: '⬅', action: 'justifyLeft', title: 'Align left', cmd: 'justifyLeft' },
      { icon: '≡', action: 'justifyCenter', title: 'Center', cmd: 'justifyCenter' },
      { icon: '➡', action: 'justifyRight', title: 'Align right', cmd: 'justifyRight' },
    ],
    [
      { icon: '🔗', action: 'createLink', title: 'Insert link' },
      { icon: '🖼', action: 'insertImage', title: 'Insert image' },
      { icon: '—', action: 'insertHorizontalRule', title: 'Horizontal rule' },
    ],
    [
      { icon: '↩', action: 'undo', title: 'Undo' },
      { icon: '↪', action: 'redo', title: 'Redo' },
      { icon: '✕', action: 'removeFormat', title: 'Clear formatting' },
    ],
  ];

  return (
    <div style={{ border: '1px solid var(--border2)', borderRadius: 5, overflow: 'hidden', background: 'var(--bg3)' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, padding: '6px 8px', borderBottom: '1px solid var(--border2)', background: 'var(--bg2)' }}>
        {TOOLBAR.map((group, gi) => (
          <div key={gi} style={{ display: 'flex', gap: 1, marginRight: 6 }}>
            {group.map(btn => (
              <button key={btn.action} type="button" title={btn.title}
                onMouseDown={e => { e.preventDefault(); handleAction(btn.action); }}
                style={{
                  background: btn.cmd && isActive(btn.cmd) ? 'var(--gold)' : 'transparent',
                  color: btn.cmd && isActive(btn.cmd) ? '#000' : 'var(--fg2)',
                  border: 'none',
                  borderRadius: 3,
                  padding: '3px 7px',
                  fontSize: btn.icon.length > 2 ? 10 : 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  minWidth: 26,
                  transition: 'all 0.1s',
                  fontFamily: btn.action === 'italic' ? 'serif' : 'inherit',
                  fontStyle: btn.action === 'italic' ? 'italic' : 'normal',
                  textDecoration: btn.action === 'underline' ? 'underline' : 'none',
                }}
                onMouseEnter={e => { if (!(btn.cmd && isActive(btn.cmd))) e.currentTarget.style.background = 'var(--bg3)'; }}
                onMouseLeave={e => { if (!(btn.cmd && isActive(btn.cmd))) e.currentTarget.style.background = 'transparent'; }}>
                {btn.icon}
              </button>
            ))}
            {gi < TOOLBAR.length - 1 && <div style={{ width: 1, background: 'var(--border)', margin: '2px 4px' }} />}
          </div>
        ))}
        {uploading && <span style={{ fontSize: 10, color: 'var(--gold)', alignSelf: 'center', marginLeft: 4 }}>Uploading image...</span>}
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={e => {
          // Tab → indent
          if (e.key === 'Tab') { e.preventDefault(); exec('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;'); }
        }}
        data-placeholder={placeholder}
        style={{
          minHeight,
          padding: '14px 16px',
          outline: 'none',
          color: 'var(--fg)',
          fontSize: 14,
          lineHeight: 1.7,
          fontFamily: 'inherit',
        }}
      />

      {/* Hidden image input */}
      <input ref={imgInputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { if (e.target.files?.[0]) uploadImage(e.target.files[0]); e.target.value = ''; }} />

      {/* Editor styles injected */}
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: var(--subtle);
          pointer-events: none;
        }
        [contenteditable] h1 { font-size: 1.8em; font-weight: 800; margin: 0.8em 0 0.4em; }
        [contenteditable] h2 { font-size: 1.4em; font-weight: 700; margin: 0.8em 0 0.4em; }
        [contenteditable] h3 { font-size: 1.15em; font-weight: 700; margin: 0.6em 0 0.3em; }
        [contenteditable] p { margin: 0 0 0.8em; }
        [contenteditable] ul { list-style: disc; padding-left: 1.5em; margin: 0.5em 0; }
        [contenteditable] ol { list-style: decimal; padding-left: 1.5em; margin: 0.5em 0; }
        [contenteditable] li { margin-bottom: 0.25em; }
        [contenteditable] blockquote { border-left: 3px solid var(--gold); padding-left: 1em; margin: 0.8em 0; color: var(--muted); font-style: italic; }
        [contenteditable] pre { background: var(--bg); padding: 0.8em 1em; border-radius: 4px; font-family: monospace; font-size: 0.85em; overflow-x: auto; margin: 0.8em 0; }
        [contenteditable] a { color: var(--gold); text-decoration: underline; }
        [contenteditable] img { max-width: 100%; border-radius: 4px; margin: 0.5em 0; }
        [contenteditable] hr { border: none; border-top: 1px solid var(--border); margin: 1em 0; }
        [contenteditable] strong { font-weight: 700; }
        [contenteditable] em { font-style: italic; }
        [contenteditable] u { text-decoration: underline; }
        [contenteditable] s { text-decoration: line-through; }
      `}</style>
    </div>
  );
}
