import { useState, useRef, useEffect, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { compileMjml, applyMockData } from './compile';
import { renderMarkdown, wrapBody, MJML_STYLES, MJML_HEAD, MJML_BODY } from './markdown';
import styles from './EmailEditor.module.css';

interface EmailEditorProps {
  initialMd?: string;
  initialMockData?: string;
  onSave?: (result: { md: string; html: string; mockData: string }) => void;
  showMockEditor?: boolean;
  mockEditorHeight?: number | string;
  defaultPreviewMode?: 'desktop' | 'mobile';
  mjStyles?: string;
  mjBody?: string;
}

const DEFAULT_MOCK = JSON.stringify(
  { 'user.name': 'John Doe', action_button: 'Open website', action_url: 'https://example.com/welcome' },
  null,
  2,
);

export function EmailEditor({
  initialMd = '',
  initialMockData,
  onSave,
  showMockEditor = true,
  mockEditorHeight = 180,
  defaultPreviewMode = 'desktop',
  mjStyles,
  mjBody,
}: EmailEditorProps) {
  const [md, setMd] = useState(initialMd);
  const [compiledHtml, setCompiledHtml] = useState('');
  const [mockData, setMockData] = useState(initialMockData ?? DEFAULT_MOCK);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>(defaultPreviewMode);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMd(initialMd);
  }, [initialMd]);

  useEffect(() => {
    if (initialMockData !== undefined) setMockData(initialMockData);
  }, [initialMockData]);

  const compileCurrent = (): string => {
    const bodyHtml = renderMarkdown(md);
    const css = mjStyles ?? MJML_STYLES;
    const head = MJML_HEAD.replace('{{markdown_styles}}', () => css);

    const body = mjBody ?? MJML_BODY;
    const finalMjml = `<mjml>${head}${body}</mjml>`.replace(
      '{{markdown_body}}',
      () => wrapBody(bodyHtml),
    );
    return compileMjml(finalMjml);
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      try {
        const html = compileCurrent();
        setCompiledHtml(html);
      } catch (e) {
        console.error('[EmailEditor] Compile error:', e);
      }
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [md, mjStyles, mjBody]);

  const previewHtml = useMemo(
    () => applyMockData(compiledHtml, mockData),
    [compiledHtml, mockData],
  );

  const handleSave = () => {
    let html = '';
    try {
      html = compileCurrent();
    } catch (e) {
      console.error('[EmailEditor] Save compile error:', e);
    }
    onSave?.({ md, html, mockData });
  };

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <button onClick={handleSave} className={styles.saveBtn}>
          Save
        </button>

        <div className={styles.toggleGroup}>
          {(['desktop', 'mobile'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setPreviewMode(mode)}
              className={`${styles.toggleBtn} ${previewMode === mode ? styles.toggleBtnActive : ''}`}
            >
              {mode === 'desktop' ? 'Desktop' : 'Mobile'}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.leftPanel}>
          <div className={styles.editorWrapper}>
            <Editor
              height="100%"
              defaultLanguage="markdown"
              value={md}
              onChange={(val) => setMd(val ?? '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
          {showMockEditor && (
            <div className={styles.mockSection}>
              <div className={styles.mockHeader}>
                Mock Data &mdash; {'{{placeholders}}'} for preview only
              </div>
              <Editor
                height={mockEditorHeight}
                defaultLanguage="json"
                value={mockData}
                onChange={(val) => setMockData(val ?? '{}')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 12,
                  lineNumbers: 'off',
                  scrollBeyondLastLine: false,
                  folding: false,
                  automaticLayout: true,
                }}
              />
            </div>
          )}
        </div>

        <div
          className={`${styles.previewPanel} ${previewMode === 'desktop' ? styles.previewPanelDesktop : styles.previewPanelMobile}`}
        >
          <div
            className={`${styles.previewFrame} ${previewMode === 'desktop' ? styles.previewFrameDesktop : styles.previewFrameMobile}`}
          >
            <iframe
              srcDoc={previewHtml}
              className={styles.iframe}
              title="Preview"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
