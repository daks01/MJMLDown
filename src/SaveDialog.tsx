import { useRef, useEffect } from 'react';

interface SaveDialogProps {
  md: string;
  html: string;
  mockData: string;
  onClose: () => void;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.6)',
  zIndex: 1000,
};

const dialogStyle: React.CSSProperties = {
  background: '#1e1e1e',
  border: '1px solid #444',
  borderRadius: 8,
  width: 700,
  maxWidth: '90vw',
  maxHeight: '85vh',
  display: 'flex',
  flexDirection: 'column',
};

const headerStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid #333',
  fontSize: 14,
  fontWeight: 600,
  color: '#ccc',
};

const bodyStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '12px 16px',
  overflow: 'auto',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#969696',
  marginBottom: 2,
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: 8,
  background: '#252526',
  color: '#d4d4d4',
  border: '1px solid #444',
  borderRadius: 4,
  fontFamily: "'Fira Code','Cascadia Code',monospace",
  fontSize: 12,
  lineHeight: 1.5,
  resize: 'vertical',
  outline: 'none',
  boxSizing: 'border-box',
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  padding: '12px 16px',
};

export function SaveDialog({ md, html, mockData, onClose }: SaveDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div ref={dialogRef} style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>Saved</div>
        <div style={bodyStyle}>
          <div style={labelStyle}>Markdown</div>
          <textarea readOnly value={md} style={{ ...textareaStyle, height: 120 }} />
          <div style={labelStyle}>Mock Data</div>
          <textarea readOnly value={mockData} style={{ ...textareaStyle, height: 100 }} />
          <div style={labelStyle}>Compiled HTML (with {'{{mustache}}'} placeholders)</div>
          <textarea readOnly value={html} style={{ ...textareaStyle, height: 200 }} />
        </div>
        <div style={footerStyle}>
          <button
            onClick={() => navigator.clipboard.writeText(html)}
            style={{
              padding: '6px 16px',
              background: '#2d2d2d',
              color: '#ccc',
              border: '1px solid #555',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Copy HTML
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              background: '#0d6efd',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
