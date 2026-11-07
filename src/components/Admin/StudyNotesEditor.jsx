import React, { useEffect, useRef, useState } from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';

const editorStyles = `
  body { font: 15px/1.7 system-ui, sans-serif; color: #173b40; }
  h1, h2, h3 { color: #005b62; line-height: 1.3; }
  p { margin: 0 0 0.8em; }
  img { display: block; max-width: 100%; height: auto; margin: 1em auto; }
  ul, ol { padding-left: 1.5em; }
  blockquote { border-left: 3px solid #00838b; margin: 1em 0; padding-left: 1em; color: #52666a; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #cbd5e1; padding: 0.4em 0.6em; }
`;

const getHtmlParts = (html) => {
  if (!html) return { body: '', styles: '' };
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  return {
    body: parsed.body.innerHTML,
    styles: Array.from(parsed.head.querySelectorAll('style'))
      .map(style => style.textContent)
      .filter(Boolean)
      .join('\n'),
  };
};

const createDocument = (body, styles) => {
  const content = body.trim();
  const hasContent = /<(img|table|video|audio|iframe)\b/i.test(content) ||
    content.replace(/<br\s*\/?>/gi, '').replace(/<\/?p[^>]*>/gi, '')
      .replace(/&nbsp;|&#160;/gi, ' ').replace(/<[^>]*>/g, '').trim();
  if (!hasContent) return '';

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${editorStyles}\n${styles}</style></head><body>${content}</body></html>`;
};

const StudyNotesEditor = ({ value, onChange }) => {
  const editorRef = useRef(null);
  const lastValueRef = useRef(null);
  const stylesRef = useRef('');
  const imageInputRef = useRef(null);
  const wordInputRef = useRef(null);
  const savedSelectionRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const nextValue = value || '';
    if (nextValue === lastValueRef.current) return;

    lastValueRef.current = nextValue;
    const { body, styles } = getHtmlParts(nextValue);
    stylesRef.current = styles;
    if (editorRef.current) editorRef.current.innerHTML = body;
  }, [value]);

  const publishEditorHtml = () => {
    const html = createDocument(editorRef.current?.innerHTML || '', stylesRef.current);
    lastValueRef.current = html;
    onChange(html);
  };

  const runCommand = (command, commandValue) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    publishEditorHtml();
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection?.rangeCount && editorRef.current?.contains(selection.anchorNode)) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  };

  const uploadAndInsertImage = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Images must be smaller than 5 MB.');
      return;
    }

    setUploadingImage(true);
    try {
      const body = new FormData();
      body.append('image', file);
      const { data } = await api.post('/api/upload', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (!data.imageUrl) throw new Error('Image upload did not return a URL.');

      editorRef.current?.focus();
      const selection = window.getSelection();
      const range = savedSelectionRef.current;
      if (range && editorRef.current?.contains(range.commonAncestorContainer)) {
        selection.removeAllRanges();
        selection.addRange(range);
      }

      const image = document.createElement('img');
      image.src = data.imageUrl;
      image.alt = file.name.replace(/\.[^.]+$/, '');
      image.style.maxWidth = '100%';
      image.style.height = 'auto';
      image.style.display = 'block';
      image.style.margin = '1em auto';
      if (selection?.rangeCount && editorRef.current?.contains(selection.anchorNode)) {
        const insertRange = selection.getRangeAt(0);
        insertRange.deleteContents();
        insertRange.insertNode(image);
        insertRange.setStartAfter(image);
        insertRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(insertRange);
        savedSelectionRef.current = insertRange.cloneRange();
      } else {
        editorRef.current?.appendChild(image);
        savedSelectionRef.current = null;
      }
      publishEditorHtml();
      toast.success('Image added to study notes.');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePaste = async (event) => {
    const imageFiles = Array.from(event.clipboardData?.items || [])
      .filter(item => item.type.startsWith('image/'))
      .map(item => item.getAsFile())
      .filter(Boolean);
    if (imageFiles.length === 0) return;

    event.preventDefault();
    saveSelection();
    for (const file of imageFiles) {
      await uploadAndInsertImage(file);
    }
  };

  const importWordDocument = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.docx')) {
      toast.error('Choose a Microsoft Word .docx document.');
      return;
    }

    setImporting(true);
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
      if (!result.value.trim()) {
        toast.error('No editable text was found in that Word document.');
        return;
      }

      stylesRef.current = '';
      if (editorRef.current) editorRef.current.innerHTML = result.value;
      publishEditorHtml();
      if (result.messages.some(message => message.type === 'warning')) {
        toast('Imported the text; some Word formatting may not be supported.');
      } else {
        toast.success('Word document imported. Review it before saving.');
      }
    } catch (error) {
      toast.error(error.message || 'Could not import the Word document.');
    } finally {
      setImporting(false);
    }
  };

  const toolButton = (label, title, command, commandValue) => (
    <button
      key={label}
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={event => event.preventDefault()}
      onClick={() => runCommand(command, commandValue)}
      className="min-w-8 rounded border border-slate-200 px-2 py-1 text-sm font-semibold text-slate-700 hover:bg-[#e8f5f4]"
    >
      {label}
    </button>
  );

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-slate-50 p-2">
        {toolButton('B', 'Bold', 'bold')}
        {toolButton('I', 'Italic', 'italic')}
        {toolButton('U', 'Underline', 'underline')}
        {toolButton('S', 'Strikethrough', 'strikeThrough')}
        <span className="mx-1 h-5 border-l border-slate-300" />
        <select
          aria-label="Text style"
          defaultValue=""
          onChange={event => {
            if (event.target.value) runCommand('formatBlock', event.target.value);
            event.target.value = '';
          }}
          className="rounded border border-slate-200 bg-white px-2 py-1 text-xs"
        >
          <option value="" disabled>Text style</option>
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="blockquote">Quote</option>
        </select>
        {toolButton('• List', 'Bulleted list', 'insertUnorderedList')}
        {toolButton('1. List', 'Numbered list', 'insertOrderedList')}
        <span className="mx-1 h-5 border-l border-slate-300" />
        {toolButton('←', 'Align left', 'justifyLeft')}
        {toolButton('↔', 'Center align', 'justifyCenter')}
        {toolButton('→', 'Align right', 'justifyRight')}
        {toolButton('↶', 'Undo', 'undo')}
        {toolButton('↷', 'Redo', 'redo')}
        {toolButton('Clear formatting', 'Clear formatting', 'removeFormat')}
        <button
          type="button"
          title="Insert image"
          aria-label="Insert image"
          onMouseDown={event => {
            event.preventDefault();
            saveSelection();
          }}
          onClick={() => imageInputRef.current?.click()}
          disabled={uploadingImage}
          className="flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-[#e8f5f4] disabled:opacity-50"
        >
          <PhotoIcon className="h-4 w-4" />
          {uploadingImage ? 'Uploading…' : 'Image'}
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={event => {
            const file = event.target.files?.[0];
            event.target.value = '';
            uploadAndInsertImage(file);
          }}
        />
        <button
          type="button"
          onClick={() => wordInputRef.current?.click()}
          disabled={importing}
          className="rounded bg-[#006770]/10 px-2.5 py-1 text-xs font-semibold text-[#006770] hover:bg-[#006770]/20 disabled:opacity-50"
        >
          {importing ? 'Importing…' : 'Import Word .docx'}
        </button>
        <input
          ref={wordInputRef}
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={importWordDocument}
        />
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Study notes editor"
        aria-multiline="true"
        onInput={publishEditorHtml}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onPaste={handlePaste}
        className="prose prose-sm min-h-48 max-w-none overflow-y-auto p-4 text-slate-800 focus:outline-none"
        style={{ minHeight: 192 }}
      />
      <div className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-[10px] text-slate-500">
        Format the notes, insert or paste images, or import a .docx file. Changes are saved with the lesson when you publish it.
      </div>
    </div>
  );
};

export default StudyNotesEditor;
