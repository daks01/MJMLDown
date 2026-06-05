import { marked } from 'marked';

export const MJML_STYLES = `
  h1 { font-size:28px; line-height:34px; font-weight:700; color:#1a1a1a; margin:0 0 16px; }
  h2 { font-size:22px; line-height:28px; font-weight:600; color:#1a1a1a; margin:0 0 12px; }
  h3 { font-size:18px; line-height:24px; font-weight:600; color:#2d2d2d; margin:0 0 10px; }
  h4 { font-size:16px; line-height:22px; font-weight:500; color:#2d2d2d; margin:0 0 8px; }
  h5 { font-size:14px; line-height:20px; font-weight:500; color:#4a4a4a; margin:0 0 6px; }
  p { font-size:16px; line-height:24px; color:#333; margin:0 0 12px !important; }
  b, strong { font-weight:700; color:#1a1a1a; }
  a { color:#2563eb; text-decoration:underline; font-weight:500; }
`;

let olCounter = 1;
let mjmlBlocks: string[] = [];

const protectMjml = (markdown: string): string => {
  mjmlBlocks = [];
  return markdown.replace(/<mj-[\s\S]*?<\/mj-[^>]+>/g, (match) => {
    mjmlBlocks.push(match);
    return `\x00MJML_BLOCK_${mjmlBlocks.length - 1}\x00`;
  });
};

const restoreMjml = (html: string): string => {
  return html.replace(/\x00MJML_BLOCK_(\d+)\x00/g, (_, index) => {
    return mjmlBlocks[parseInt(index)];
  });
};

const renderer = new marked.Renderer();

renderer.list = function (token: any) {
  const { items, ordered } = token;
  const start = Number(token.start) || 1;
  if (ordered) olCounter = start;

  function renderItemTokens(tokens: readonly any[]): string {
    let out = '';
    for (const child of tokens) {
      if (child.type === 'list') {
        out += renderer.list(child);
      } else if ('tokens' in child && child.tokens.length > 0) {
        out += marked.Parser.parseInline(child.tokens, marked.defaults);
      } else if ('text' in child) {
        out += child.text;
      }
    }
    return out;
  }

  return items
    .map((item: any) => {
      const prefix = ordered ? `${olCounter}. ` : '• ';
      if (ordered) olCounter++;
      const inner = renderItemTokens(item.tokens);
      return `<p style="margin:0 0 8px;padding-left:20px;">${prefix}${inner}</p>`;
    })
    .join('');
};

renderer.listitem = function (token: any) {
  return token.text;
};

renderer.heading = function (token: any) {
  const depth = Number(token.depth);
  const text = this.parser.parseInline(token.tokens);
  const sizes: Record<number, string> = {
    1: 'font-size:28px;line-height:34px;font-weight:700;color:#1a1a1a;margin:0 0 16px;',
    2: 'font-size:22px;line-height:28px;font-weight:600;color:#1a1a1a;margin:0 0 12px;',
    3: 'font-size:18px;line-height:24px;font-weight:600;color:#2d2d2d;margin:0 0 10px;',
    4: 'font-size:16px;line-height:22px;font-weight:500;color:#2d2d2d;margin:0 0 8px;',
    5: 'font-size:14px;line-height:20px;font-weight:500;color:#4a4a4a;margin:0 0 6px;',
  };
  return `<h${depth} style="${sizes[depth] || ''}">${text}</h${depth}>`;
};

renderer.paragraph = function (token: any) {
  const text = this.parser.parseInline(token.tokens);
  return `<p style="font-size:16px;line-height:24px;color:#333;margin:0 0 12px;">${text}</p>`;
};

renderer.link = function (token: any) {
  const text = this.parser.parseInline(token.tokens);
  return `<a href="${token.href}" style="color:#2563eb;text-decoration:underline;font-weight:500;">${text}</a>`;
};

renderer.strong = function (token: any) {
  const text = this.parser.parseInline(token.tokens);
  return `<strong style="font-weight:700;color:#1a1a1a;">${text}</strong>`;
};

renderer.html = function (token: any) {
  return token.text;
};

marked.setOptions({ renderer, breaks: true, gfm: true });

export function renderMarkdown(md: string): string {
  olCounter = 1;
  const protectedMd = protectMjml(md);
  const html = marked.parse(protectedMd) as string;
  return restoreMjml(html);
}

export const MJML_HEAD = `
  <mj-head>
    <mj-attributes>
      <mj-all font-family="Arial, sans-serif" />
    </mj-attributes>
    <mj-style>
{{markdown_styles}}
    </mj-style>
  </mj-head>`;

export const MJML_BODY = `
  <mj-body background-color="#f4f4f4">
    <mj-section background-color="#ffffff" padding="20px">
      <mj-column>
        {{markdown_body}}
      </mj-column>
    </mj-section>
  </mj-body>`;

const MJML_TAG_RE = /<mj-[\s\S]*?<\/mj-[^>]+>/g;

export function wrapBody(html: string): string {
  const parts = html.split(MJML_TAG_RE);
  const tags = html.match(MJML_TAG_RE) ?? [];
  let out = '';
  for (let i = 0; i < parts.length; i++) {
    if (parts[i]) out += `<mj-raw>${parts[i]}</mj-raw>`;
    if (tags[i]) out += tags[i];
  }
  return out;
}
