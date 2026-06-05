/// <reference types="vite/client" />

declare module 'mjml-browser' {
  interface MJMLResult {
    html: string;
    errors: Array<{
      line: number;
      message: string;
      tagName: string;
      formattedMessage: string;
    }>;
  }
  function mjml2html(input: string, options?: Record<string, unknown>): MJMLResult;
  export default mjml2html;
}
