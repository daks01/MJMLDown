import mjml2html from 'mjml-browser';

export function compileMjml(mjml: string): string {
  const result = mjml2html(mjml);
  return result.html;
}

export function applyMockData(html: string, mockJson: string): string {
  try {
    const data = JSON.parse(mockJson);
    return html.replace(/\{\{(.+?)\}\}/g, (_, key) => {
      const trimmed = key.trim();
      return data[trimmed] !== undefined ? String(data[trimmed]) : `{{${trimmed}}}`;
    });
  } catch {
    return html;
  }
}
