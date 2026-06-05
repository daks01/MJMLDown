# MJMLDown

**MJML & Markdown Mail Editor** — a React component for crafting email templates.

Write content in **markdown**, it compiles to MJML → HTML with live preview (Desktop / Mobile). No backend, no external API calls.

## Why

HTML email is tedious: tables, inline styles, broken clients. MJML solves half of it, but writing MJML by hand still feels like boilerplate.

**MJMLDown** lets you write content in markdown while keeping MJML for the layout shell and components (`<mj-button>`, `<mj-image>`, etc.). MJML tags can be placed directly inside markdown — they're extracted and handled correctly.

Inline styles (via custom marked renderer) serve as a fallback for email clients that strip `<style>`. 

Mustache placeholders (`{{user.name}}`) stay intact in compiled HTML for your template engine.

## Usage

```tsx
import { EmailEditor } from './EmailEditor';

function App() {
  return (
    <EmailEditor
      initialMd="# Hello, {{user.name}}!"
      initialMockData='{"user.name":"John Doe"}'
      onSave={({ md, html, mockData }) => {
        // md — raw markdown
        // html — compiled MJML→HTML, placeholders preserved
        // mockData — mock JSON from the editor
      }}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialMd` | `string` | `''` | Initial markdown |
| `initialMockData` | `string` | — | Initial mock data as JSON string |
| `onSave` | `({ md, html, mockData }) => void` | — | Fired on Save |
| `showMockEditor` | `boolean` | `true` | Show/hide the mock data editor |
| `mockEditorHeight` | `number \| string` | `180` | Mock editor height |
| `defaultPreviewMode` | `'desktop' \| 'mobile'` | `'desktop'` | Initial preview mode |
| `mjStyles` | `string` | — | CSS rules for `<mj-style>` (overrides defaults) |
| `mjBody` | `string` | — | Override the entire `<mj-body>`. Must contain `{{markdown_body}}` |

## Pipeline

```
Markdown → marked.parse() → HTML (inline styles) → split by MJML blocks
  → non-MJML wrapped in <mj-raw>, MJML blocks as-is → head + body(mjBody) → mjml2html()
```

## Development

```sh
npm install
npm run dev     # Vite dev server
npm run build   # TypeScript + Vite build
npm run test    # Vitest (32 tests)
```
