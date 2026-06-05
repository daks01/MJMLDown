import { describe, it, expect, vi, beforeEach } from 'vitest';
import { compileMjml, applyMockData } from './compile';
import { renderMarkdown, wrapBody, MJML_STYLES, MJML_HEAD } from './markdown';
import mjml2html from 'mjml-browser';

vi.mock('mjml-browser', () => ({
  default: vi.fn(),
}));

const mockMjml2html = mjml2html as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockMjml2html.mockReset();
  mockMjml2html.mockReturnValue({ html: '<compiled-html />', errors: [] });
});

describe('compileMjml', () => {
  it('returns HTML from mjml2html for valid MJML', () => {
    const expectedHtml = '<html><body>Hello {{user.name}}</body></html>';
    mockMjml2html.mockReturnValue({ html: expectedHtml, errors: [] });

    const result = compileMjml('<mjml><mj-body>Hello {{user.name}}</mj-body></mjml>');
    expect(result).toBe(expectedHtml);
    expect(mockMjml2html).toHaveBeenCalledOnce();
  });

  it('preserves {{placeholders}} in compiled output', () => {
    mockMjml2html.mockReturnValue({ html: '<a href="{{action_url}}">link</a>', errors: [] });

    const result = compileMjml('<mjml><mj-body><mj-button href="{{action_url}}">link</mj-button></mj-body></mjml>');
    expect(result).toContain('{{action_url}}');
  });

  it('throws when mjml2html fails', () => {
    mockMjml2html.mockImplementation(() => {
      throw new Error('Invalid MJML');
    });

    expect(() => compileMjml('bad input')).toThrow('Invalid MJML');
  });
});

describe('applyMockData', () => {
  const html = '<p>Hello {{user.name}}!</p><a href="{{action_url}}">link</a>';

  it('replaces {{placeholders}} with matching values from JSON', () => {
    const mock = JSON.stringify({ 'user.name': 'John', action_url: 'https://x.com' });
    expect(applyMockData(html, mock)).toBe(
      '<p>Hello John!</p><a href="https://x.com">link</a>',
    );
  });

  it('leaves unknown placeholders as-is', () => {
    const mock = JSON.stringify({ 'user.name': 'John' });
    expect(applyMockData(html, mock)).toBe(
      '<p>Hello John!</p><a href="{{action_url}}">link</a>',
    );
  });

  it('returns original HTML when mockJson is not valid JSON', () => {
    expect(applyMockData(html, '{broken')).toBe(html);
  });

  it('returns original HTML unchanged when there are no placeholders', () => {
    const plainHtml = '<p>No variables here</p>';
    expect(applyMockData(plainHtml, '{}')).toBe(plainHtml);
  });

  it('handles empty mock JSON — all placeholders stay', () => {
    expect(applyMockData(html, '{}')).toBe(html);
  });

  it('trims whitespace inside {{ }} before lookup', () => {
    const spaced = '<p>{{  name  }}</p>';
    expect(applyMockData(spaced, JSON.stringify({ name: 'Jane' }))).toBe(
      '<p>Jane</p>',
    );
  });

  it('coerces numeric and boolean values to string', () => {
    const withNumbers = '<p>{{count}} {{active}}</p>';
    expect(
      applyMockData(withNumbers, JSON.stringify({ count: 42, active: true })),
    ).toBe('<p>42 true</p>');
  });
});

describe('renderMarkdown', () => {
  it('renders a paragraph with inline style', () => {
    const result = renderMarkdown('Hello world');
    expect(result).toMatch(/^<p style="[^"]*">Hello world<\/p>$/);
  });

  it('renders heading 1 with inline style', () => {
    const result = renderMarkdown('# Title');
    expect(result).toMatch(/^<h1 style="font-size:28px/);
  });

  it('renders heading 2–5 with correct sizes', () => {
    expect(renderMarkdown('## h2')).toMatch(/<h2 style="font-size:22px/);
    expect(renderMarkdown('### h3')).toMatch(/<h3 style="font-size:18px/);
    expect(renderMarkdown('#### h4')).toMatch(/<h4 style="font-size:16px/);
    expect(renderMarkdown('##### h5')).toMatch(/<h5 style="font-size:14px/);
  });

  it('renders a link with inline style and href', () => {
    const result = renderMarkdown('[click](https://x.com)');
    expect(result).toContain('href="https://x.com"');
    expect(result).toContain('style="color:#2563eb;');
  });

  it('renders strong with inline style', () => {
    const result = renderMarkdown('**bold**');
    expect(result).toContain('<strong style="font-weight:700;color:#1a1a1a;">bold</strong>');
  });

  it('renders an unordered list as <p> with bullet prefix', () => {
    const result = renderMarkdown('- a\n- b');
    expect(result).toContain('<p style="margin:0 0 8px;padding-left:20px;">• a</p>');
    expect(result).toContain('<p style="margin:0 0 8px;padding-left:20px;">• b</p>');
  });

  it('renders an ordered list as <p> with number prefix', () => {
    const result = renderMarkdown('1. first\n2. second');
    expect(result).toContain('<p style="margin:0 0 8px;padding-left:20px;">1. first</p>');
    expect(result).toContain('<p style="margin:0 0 8px;padding-left:20px;">2. second</p>');
  });

  it('preserves MJML blocks in markdown', () => {
    const result = renderMarkdown('text\n<mj-button href="{{url}}">go</mj-button>\nmore');
    expect(result).toContain('<mj-button href="{{url}}">go</mj-button>');
  });

  it('preserves multiple MJML blocks', () => {
    const md = '<mj-button>a</mj-button>\n\n<mj-button>b</mj-button>';
    const result = renderMarkdown(md);
    expect(result).toContain('<mj-button>a</mj-button>');
    expect(result).toContain('<mj-button>b</mj-button>');
  });

  it('surrounds MJML blocks with compiled HTML', () => {
    const result = renderMarkdown('hi\n<mj-button>go</mj-button>\nbye');
    expect(result).toContain('hi');
    expect(result).toContain('bye');
    expect(result).toContain('<mj-button>go</mj-button>');
  });

  it('returns empty string for empty input', () => {
    expect(renderMarkdown('')).toBe('');
  });

  it('passes marked html tokens through verbatim', () => {
    const result = renderMarkdown('<div class="custom">raw</div>');
    expect(result).toContain('<div class="custom">raw</div>');
  });
});

describe('wrapBody', () => {
  it('wraps plain HTML in a single <mj-raw>', () => {
    const result = wrapBody('<p>Hello</p>');
    expect(result).toBe('<mj-raw><p>Hello</p></mj-raw>');
  });

  it('wraps nothing when HTML is empty', () => {
    expect(wrapBody('')).toBe('');
  });

  it('leaves a single MJML block unwrapped', () => {
    const result = wrapBody('<mj-button>click</mj-button>');
    expect(result).toBe('<mj-button>click</mj-button>');
  });

  it('wraps text before and after MJML block, leaves block as-is', () => {
    const result = wrapBody('<p>a</p><mj-button>click</mj-button><p>b</p>');
    expect(result).toBe(
      '<mj-raw><p>a</p></mj-raw><mj-button>click</mj-button><mj-raw><p>b</p></mj-raw>',
    );
  });

  it('handles multiple MJML blocks interspersed', () => {
    const result = wrapBody('<p>a</p><mj-button>1</mj-button><p>b</p><mj-button>2</mj-button>');
    expect(result).toBe(
      '<mj-raw><p>a</p></mj-raw><mj-button>1</mj-button><mj-raw><p>b</p></mj-raw><mj-button>2</mj-button>',
    );
  });

  it('extracts MJML blocks with attributes and closing tag', () => {
    const result = wrapBody('a<mj-button href="{{url}}">go</mj-button>b');
    expect(result).toBe(
      '<mj-raw>a</mj-raw><mj-button href="{{url}}">go</mj-button><mj-raw>b</mj-raw>',
    );
  });

  it('leaves self-closing MJML tags inside <mj-raw> (regex requires closing tag)', () => {
    const result = wrapBody('text<mj-image width="100" src="img.jpg" />text');
    expect(result).toBe(
      '<mj-raw>text<mj-image width="100" src="img.jpg" />text</mj-raw>',
    );
  });
});

describe('full pipeline', () => {
  it('passes correct MJML to mjml2html', () => {
    mockMjml2html.mockClear();

    const md = 'Hello {{name}}';
    const bodyHtml = renderMarkdown(md);
    const wrapped = wrapBody(bodyHtml);
    const head = MJML_HEAD.replace('{{markdown_styles}}', () => MJML_STYLES);
    const finalMjml = `<mjml>${head}<mj-body background-color="#f4f4f4">
    <mj-section background-color="#ffffff" padding="20px">
      <mj-column>
        {{markdown_body}}
      </mj-column>
    </mj-section>
  </mj-body></mjml>`.replace('{{markdown_body}}', () => wrapped);

    compileMjml(finalMjml);

    expect(mockMjml2html).toHaveBeenCalledOnce();
    const callArg = mockMjml2html.mock.calls[0][0];
    expect(callArg).toContain('<mjml>');
    expect(callArg).toContain('<mj-head>');
    expect(callArg).toContain('<mj-body');
    expect(callArg).toContain('Hello');
    expect(callArg).toContain('mj-raw');
    expect(callArg).toContain('<mj-style>');
  });

  it('compiled HTML contains rendered markdown text', () => {
    mockMjml2html.mockReturnValue({
      html: '<html><body><p>Hello World</p></body></html>',
      errors: [],
    });

    const md = 'Hello World';
    const bodyHtml = renderMarkdown(md);
    const wrapped = wrapBody(bodyHtml);
    const head = MJML_HEAD.replace('{{markdown_styles}}', () => MJML_STYLES);
    const finalMjml = `<mjml>${head}<mj-body background-color="#f4f4f4">
    <mj-section background-color="#ffffff" padding="20px">
      <mj-column>
        {{markdown_body}}
      </mj-column>
    </mj-section>
  </mj-body></mjml>`.replace('{{markdown_body}}', () => wrapped);

    const result = compileMjml(finalMjml);
    expect(result).toContain('Hello World');
  });

  it('MJML blocks from markdown appear directly in the MJML template (not in <mj-raw>)', () => {
    mockMjml2html.mockClear();

    const md = '<mj-button href="{{url}}">go</mj-button>';
    const bodyHtml = renderMarkdown(md);
    const wrapped = wrapBody(bodyHtml);
    const head = MJML_HEAD.replace('{{markdown_styles}}', () => MJML_STYLES);
    const finalMjml = `<mjml>${head}<mj-body background-color="#f4f4f4">
    <mj-section background-color="#ffffff" padding="20px">
      <mj-column>
        {{markdown_body}}
      </mj-column>
    </mj-section>
  </mj-body></mjml>`.replace('{{markdown_body}}', () => wrapped);

    compileMjml(finalMjml);
    const callArg = mockMjml2html.mock.calls[0][0];
    expect(callArg).toContain('<mj-button href="{{url}}">go</mj-button>');
    expect(callArg).not.toContain('<mj-raw><mj-button');
  });
});
