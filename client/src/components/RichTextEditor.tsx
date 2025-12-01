import { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ script: 'sub' }, { script: 'super' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ align: [] }],
        ['link', 'image', 'video'],
        ['blockquote', 'code-block'],
        ['clean'],
      ],
      clipboard: {
        matchVisual: false,
      },
    }),
    []
  );

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'script',
    'indent',
    'align',
    'link',
    'image',
    'video',
    'blockquote',
    'code-block',
  ];

  return (
    <div style={{ marginBottom: 'var(--spacing-md)' }}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || 'Rédigez votre article...'}
        style={{
          background: '#fff',
          borderRadius: 'var(--radius-md)',
        }}
      />
      <style>{`
        .ql-container {
          font-size: 1rem;
          min-height: 400px;
          border-bottom-left-radius: var(--radius-md);
          border-bottom-right-radius: var(--radius-md);
        }
        .ql-editor {
          min-height: 400px;
          line-height: 1.6;
        }
        .ql-toolbar {
          border-top-left-radius: var(--radius-md);
          border-top-right-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          border-bottom: none;
          background: #f9fafb;
        }
        .ql-container {
          border: 1px solid var(--color-border);
          border-top: none;
        }
        .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        .ql-snow .ql-picker {
          color: #374151;
        }
        .ql-snow .ql-stroke {
          stroke: #374151;
        }
        .ql-snow .ql-fill {
          fill: #374151;
        }
        .ql-snow .ql-picker-options {
          background: #fff;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
        }
        .ql-snow .ql-tooltip {
          background: #fff;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .ql-snow .ql-tooltip input[type=text] {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
        }
        .ql-snow a {
          color: var(--color-primary);
        }
        .ql-snow .ql-editor blockquote {
          border-left: 4px solid var(--color-primary);
          padding-left: var(--spacing-md);
          margin: var(--spacing-md) 0;
          color: #6b7280;
        }
        .ql-snow .ql-editor code,
        .ql-snow .ql-editor pre.ql-syntax {
          background: #f3f4f6;
          border-radius: var(--radius-sm);
          padding: 2px 6px;
          font-family: 'Courier New', monospace;
        }
        .ql-snow .ql-editor pre.ql-syntax {
          padding: var(--spacing-md);
          margin: var(--spacing-md) 0;
        }
        .ql-snow .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: var(--radius-md);
        }
      `}</style>
    </div>
  );
}

