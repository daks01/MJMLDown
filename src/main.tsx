import React from 'react';
import ReactDOM from 'react-dom/client';
import { useState } from 'react';
import { EmailEditor } from './EmailEditor';
import { SaveDialog } from './SaveDialog';

const INITIAL_MD = `## Welcome, {{user.name}}!

We're thrilled to have you on board. Here's what's new:

- **Product Update** — Check out our latest features
- **Community** — Join the discussion on our forum
- **Support** — We're here to help 24/7

---

If you have any questions, feel free to [contact us](mailto:support@example.com).

Best regards,
The Team

<mj-button background-color="#F45E43" href="{{action_url}}">
  {{action_button}}
</mj-button>
`;

function App() {
  const [saveResult, setSaveResult] = useState<{ md: string; html: string; mockData: string } | null>(null);

  return (
    <>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <EmailEditor
          initialMd={INITIAL_MD}
          onSave={(result) => setSaveResult(result)}
        />
      </div>
      {saveResult && (
        <SaveDialog
          md={saveResult.md}
          html={saveResult.html}
          mockData={saveResult.mockData}
          onClose={() => setSaveResult(null)}
        />
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
