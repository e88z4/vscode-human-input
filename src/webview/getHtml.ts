/**
 * HTML/CSS generator for Webview Modal Dialogs.
 * Produces themed, centered dialog forms for each tool type.
 * Uses VS Code CSS variables for automatic dark/light theme support.
 */

export interface DialogConfig {
  type: 'input' | 'choice' | 'multiline' | 'confirmation' | 'info';
  title: string;
  prompt: string;
  defaultValue?: string;
  inputType?: 'text' | 'integer' | 'float';
  choices?: string[];
  allowMultiple?: boolean;
  message?: string;
}

/**
 * Escape HTML special characters to prevent XSS in webview content.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Convert basic Markdown to HTML for rendering inside webview dialogs.
 * Escapes HTML first for safety, then applies Markdown transforms.
 */
export function markdownToHtml(text: string): string {
  let html = escapeHtml(text);

  // Code blocks (``` ... ```) — must come before line-level rules
  html = html.replace(/```([\s\S]*?)```/g, (_m, code) => {
    return `<pre style="background:var(--vscode-textCodeBlock-background,rgba(255,255,255,0.06));padding:10px 14px;border-radius:4px;overflow-x:auto;font-family:var(--vscode-editor-font-family,monospace);font-size:var(--vscode-editor-font-size,13px);line-height:1.5;margin:8px 0;">${code.trim()}</pre>`;
  });

  // Split into lines for block-level processing
  const lines = html.split('\n');
  const output: string[] = [];
  let inUl = false;
  let inOl = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Close open lists if line is not a list item
    const isUlItem = /^[-*]\s+/.test(line);
    const isOlItem = /^\d+\.\s+/.test(line);

    if (inUl && !isUlItem) {
      output.push('</ul>');
      inUl = false;
    }
    if (inOl && !isOlItem) {
      output.push('</ol>');
      inOl = false;
    }

    // Headings
    if (/^####\s+(.+)$/.test(line)) {
      line = line.replace(/^####\s+(.+)$/, '<h4 style="margin:12px 0 4px;">$1</h4>');
      output.push(line);
      continue;
    }
    if (/^###\s+(.+)$/.test(line)) {
      line = line.replace(/^###\s+(.+)$/, '<h3 style="margin:14px 0 6px;">$1</h3>');
      output.push(line);
      continue;
    }
    if (/^##\s+(.+)$/.test(line)) {
      line = line.replace(/^##\s+(.+)$/, '<h2 style="margin:16px 0 8px;">$1</h2>');
      output.push(line);
      continue;
    }
    if (/^#\s+(.+)$/.test(line)) {
      line = line.replace(/^#\s+(.+)$/, '<h1 style="margin:16px 0 8px;">$1</h1>');
      output.push(line);
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      output.push('<hr style="border:none;border-top:1px solid var(--vscode-editorWidget-border,#454545);margin:12px 0;">');
      continue;
    }

    // Blockquote
    if (/^&gt;\s*(.*)$/.test(line)) {
      line = line.replace(
        /^&gt;\s*(.*)$/,
        '<blockquote style="border-left:3px solid var(--vscode-focusBorder,#007acc);padding:4px 12px;margin:6px 0;color:var(--vscode-descriptionForeground);">$1</blockquote>'
      );
      output.push(line);
      continue;
    }

    // Unordered list
    if (isUlItem) {
      if (!inUl) {
        output.push('<ul style="margin:6px 0;padding-left:24px;">');
        inUl = true;
      }
      line = line.replace(/^[-*]\s+(.+)$/, '<li>$1</li>');
      output.push(line);
      continue;
    }

    // Ordered list
    if (isOlItem) {
      if (!inOl) {
        output.push('<ol style="margin:6px 0;padding-left:24px;">');
        inOl = true;
      }
      line = line.replace(/^\d+\.\s+(.+)$/, '<li>$1</li>');
      output.push(line);
      continue;
    }

    // Empty line → paragraph break
    if (line.trim() === '') {
      output.push('<br>');
      continue;
    }

    // Regular paragraph line
    output.push(line);
  }

  // Close any open lists
  if (inUl) output.push('</ul>');
  if (inOl) output.push('</ol>');

  html = output.join('\n');

  // Inline formatting (applied after block-level)
  // Bold: **text** or __text__
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic: *text* or _text_ (but not inside URLs or already-converted tags)
  html = html.replace(/(?<!\w)\*([^*]+?)\*(?!\w)/g, '<em>$1</em>');
  html = html.replace(/(?<!\w)_([^_]+?)_(?!\w)/g, '<em>$1</em>');

  // Inline code: `code`
  html = html.replace(
    /`([^`]+?)`/g,
    '<code style="background:var(--vscode-textCodeBlock-background,rgba(255,255,255,0.06));padding:2px 5px;border-radius:3px;font-family:var(--vscode-editor-font-family,monospace);font-size:0.92em;">$1</code>'
  );

  // Links: [text](url)
  html = html.replace(
    /\[([^\]]+?)\]\(([^)]+?)\)/g,
    '<a href="$2" style="color:var(--vscode-textLink-foreground,#3794ff);">$1</a>'
  );

  return html;
}

/**
 * Generate the base CSS styles using VS Code theme variables.
 */
function getBaseStyles(): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
      font-size: var(--vscode-font-size, 13px);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .dialog-card {
      background: var(--vscode-editorWidget-background, var(--vscode-editor-background));
      border: 1px solid var(--vscode-editorWidget-border, var(--vscode-widget-border, #454545));
      border-radius: 8px;
      padding: 28px 32px;
      max-width: 560px;
      width: 100%;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    .dialog-icon {
      font-size: 28px;
      margin-bottom: 12px;
    }
    .dialog-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--vscode-foreground);
      margin-bottom: 8px;
    }
    .dialog-prompt {
      font-size: 13px;
      color: var(--vscode-descriptionForeground, var(--vscode-foreground));
      margin-bottom: 20px;
      line-height: 1.5;
    }
    .input-field {
      width: 100%;
      padding: 8px 12px;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: var(--vscode-editor-font-size, 13px);
      color: var(--vscode-input-foreground);
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border, var(--vscode-widget-border, #454545));
      border-radius: 4px;
      outline: none;
      margin-bottom: 16px;
    }
    .input-field:focus {
      border-color: var(--vscode-focusBorder);
      outline: 1px solid var(--vscode-focusBorder);
    }
    textarea.input-field {
      min-height: 200px;
      resize: vertical;
      line-height: 1.5;
    }
    .input-hint {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-top: -12px;
      margin-bottom: 16px;
    }
    .button-row {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 8px;
    }
    button {
      padding: 8px 20px;
      font-size: 13px;
      font-family: var(--vscode-font-family);
      border-radius: 4px;
      cursor: pointer;
      border: none;
      outline: none;
      font-weight: 500;
    }
    button:focus {
      outline: 2px solid var(--vscode-focusBorder);
      outline-offset: 1px;
    }
    .btn-primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    .btn-primary:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .btn-secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    .btn-secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    .choice-list {
      list-style: none;
      margin-bottom: 16px;
    }
    .choice-item {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      border: 1px solid var(--vscode-input-border, var(--vscode-widget-border, #454545));
      border-radius: 4px;
      margin-bottom: 6px;
      cursor: pointer;
      background: var(--vscode-input-background);
      transition: border-color 0.15s, background 0.15s;
    }
    .choice-item:hover {
      border-color: var(--vscode-focusBorder);
      background: var(--vscode-list-hoverBackground, var(--vscode-input-background));
    }
    .choice-item.selected {
      border-color: var(--vscode-focusBorder);
      background: var(--vscode-list-activeSelectionBackground, var(--vscode-button-background));
      color: var(--vscode-list-activeSelectionForeground, var(--vscode-button-foreground));
    }
    .choice-item input[type="radio"],
    .choice-item input[type="checkbox"] {
      margin-right: 10px;
      accent-color: var(--vscode-button-background);
    }
    .choice-item label {
      cursor: pointer;
      flex: 1;
    }
    .info-message {
      padding: 16px;
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border, var(--vscode-widget-border, #454545));
      border-radius: 4px;
      margin-bottom: 16px;
      line-height: 1.6;
    }
    .confirm-message {
      padding: 16px;
      background: var(--vscode-inputValidation-warningBackground, var(--vscode-input-background));
      border: 1px solid var(--vscode-inputValidation-warningBorder, var(--vscode-input-border, #b89500));
      border-radius: 4px;
      margin-bottom: 16px;
      line-height: 1.6;
    }
    .validation-error {
      color: var(--vscode-errorForeground, #f44747);
      font-size: 12px;
      margin-top: -12px;
      margin-bottom: 12px;
      display: none;
    }
  `;
}

/**
 * Generate HTML for single-line input dialog.
 */
function getInputHtml(config: DialogConfig): string {
  const inputTypeAttr = config.inputType === 'integer' || config.inputType === 'float' ? 'number' : 'text';
  const stepAttr = config.inputType === 'float' ? 'step="any"' : config.inputType === 'integer' ? 'step="1"' : '';
  const hint = config.inputType && config.inputType !== 'text'
    ? `<div class="input-hint">Expected: ${config.inputType}</div>`
    : '';

  return `
    <div class="dialog-card">
      <div class="dialog-icon">✏️</div>
      <div class="dialog-title">${escapeHtml(config.title)}</div>
      <div class="dialog-prompt">${markdownToHtml(config.prompt)}</div>
      <input
        class="input-field"
        id="inputField"
        type="${inputTypeAttr}"
        ${stepAttr}
        value="${escapeHtml(config.defaultValue || '')}"
        placeholder="Type your answer here..."
        autofocus
      />
      ${hint}
      <div class="validation-error" id="validationError"></div>
      <div class="button-row">
        <button class="btn-secondary" onclick="cancel()">Cancel</button>
        <button class="btn-primary" onclick="submit()">Submit</button>
      </div>
    </div>
    <script>
      const vscode = acquireVsCodeApi();
      const input = document.getElementById('inputField');

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submit();
        if (e.key === 'Escape') cancel();
      });

      function submit() {
        const value = input.value;
        ${config.inputType === 'integer' ? `
        if (value && isNaN(parseInt(value, 10))) {
          showError('Please enter a valid integer');
          return;
        }` : ''}
        ${config.inputType === 'float' ? `
        if (value && isNaN(parseFloat(value))) {
          showError('Please enter a valid number');
          return;
        }` : ''}
        vscode.postMessage({ action: 'submit', value: value });
      }

      function cancel() {
        vscode.postMessage({ action: 'cancel' });
      }

      function showError(msg) {
        const el = document.getElementById('validationError');
        el.textContent = msg;
        el.style.display = 'block';
        setTimeout(() => { el.style.display = 'none'; }, 3000);
      }

      input.focus();
    </script>
  `;
}

/**
 * Generate HTML for choice/selection dialog.
 */
function getChoiceHtml(config: DialogConfig): string {
  const choices = config.choices || [];
  const inputType = config.allowMultiple ? 'checkbox' : 'radio';

  const choiceItems = choices
    .map(
      (choice, i) => `
      <div class="choice-item" onclick="toggleChoice(${i})">
        <input type="${inputType}" name="choice" id="choice_${i}" value="${escapeHtml(choice)}" />
        <label for="choice_${i}">${escapeHtml(choice)}</label>
      </div>`
    )
    .join('');

  return `
    <div class="dialog-card">
      <div class="dialog-icon">📋</div>
      <div class="dialog-title">${escapeHtml(config.title)}</div>
      <div class="dialog-prompt">${markdownToHtml(config.prompt)}${config.allowMultiple ? ' (select one or more)' : ''}</div>
      <div class="choice-list">
        ${choiceItems}
      </div>
      <div class="button-row">
        <button class="btn-secondary" onclick="cancel()">Cancel</button>
        <button class="btn-primary" onclick="submit()">Submit</button>
      </div>
    </div>
    <script>
      const vscode = acquireVsCodeApi();
      const isMultiple = ${config.allowMultiple ? 'true' : 'false'};

      function toggleChoice(index) {
        const input = document.getElementById('choice_' + index);
        const item = input.closest('.choice-item');

        if (isMultiple) {
          input.checked = !input.checked;
          item.classList.toggle('selected', input.checked);
        } else {
          // Deselect all
          document.querySelectorAll('.choice-item').forEach(el => el.classList.remove('selected'));
          document.querySelectorAll('input[name="choice"]').forEach(el => el.checked = false);
          // Select this one
          input.checked = true;
          item.classList.add('selected');
        }
      }

      function submit() {
        const checked = document.querySelectorAll('input[name="choice"]:checked');
        const values = Array.from(checked).map(el => el.value);
        if (values.length === 0) return; // require at least one selection
        vscode.postMessage({ action: 'submit', value: isMultiple ? values : values[0] });
      }

      function cancel() {
        vscode.postMessage({ action: 'cancel' });
      }

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cancel();
        if (e.key === 'Enter') submit();
      });
    </script>
  `;
}

/**
 * Generate HTML for multiline text input dialog.
 */
function getMultilineHtml(config: DialogConfig): string {
  return `
    <div class="dialog-card">
      <div class="dialog-icon">📝</div>
      <div class="dialog-title">${escapeHtml(config.title)}</div>
      <div class="dialog-prompt">${markdownToHtml(config.prompt)}</div>
      <textarea
        class="input-field"
        id="textArea"
        placeholder="Type or paste your text here..."
        autofocus
      >${escapeHtml(config.defaultValue || '')}</textarea>
      <div class="button-row">
        <button class="btn-secondary" onclick="cancel()">Cancel</button>
        <button class="btn-primary" onclick="submit()">Submit</button>
      </div>
    </div>
    <script>
      const vscode = acquireVsCodeApi();
      const textarea = document.getElementById('textArea');

      function submit() {
        vscode.postMessage({ action: 'submit', value: textarea.value });
      }

      function cancel() {
        vscode.postMessage({ action: 'cancel' });
      }

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cancel();
        // Ctrl+Enter or Cmd+Enter to submit (Enter alone adds newline)
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit();
      });

      textarea.focus();
    </script>
  `;
}

/**
 * Generate HTML for confirmation dialog.
 */
function getConfirmationHtml(config: DialogConfig): string {
  return `
    <div class="dialog-card">
      <div class="dialog-icon">⚠️</div>
      <div class="dialog-title">${escapeHtml(config.title)}</div>
      <div class="dialog-prompt">${markdownToHtml(config.prompt)}</div>
      <div class="confirm-message">${markdownToHtml(config.message || config.prompt)}</div>
      <div class="button-row">
        <button class="btn-secondary" onclick="respond('no')">No</button>
        <button class="btn-primary" onclick="respond('yes')">Yes</button>
      </div>
    </div>
    <script>
      const vscode = acquireVsCodeApi();

      function respond(value) {
        vscode.postMessage({ action: 'submit', value: value });
      }

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') respond('no');
        if (e.key === 'Enter') respond('yes');
        if (e.key === 'y' || e.key === 'Y') respond('yes');
        if (e.key === 'n' || e.key === 'N') respond('no');
      });
    </script>
  `;
}

/**
 * Generate HTML for info message dialog.
 */
function getInfoHtml(config: DialogConfig): string {
  return `
    <div class="dialog-card">
      <div class="dialog-icon">ℹ️</div>
      <div class="dialog-title">${escapeHtml(config.title)}</div>
      <div class="dialog-prompt">${markdownToHtml(config.prompt)}</div>
      <div class="info-message">${markdownToHtml(config.message || config.prompt)}</div>
      <div class="button-row">
        <button class="btn-primary" onclick="acknowledge()">OK</button>
      </div>
    </div>
    <script>
      const vscode = acquireVsCodeApi();

      function acknowledge() {
        vscode.postMessage({ action: 'submit', value: 'ok' });
      }

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Enter') acknowledge();
      });
    </script>
  `;
}

/**
 * Generate complete HTML page for a dialog config.
 */
export function getDialogHtml(config: DialogConfig): string {
  let body: string;

  switch (config.type) {
    case 'input':
      body = getInputHtml(config);
      break;
    case 'choice':
      body = getChoiceHtml(config);
      break;
    case 'multiline':
      body = getMultilineHtml(config);
      break;
    case 'confirmation':
      body = getConfirmationHtml(config);
      break;
    case 'info':
      body = getInfoHtml(config);
      break;
    default:
      body = '<div class="dialog-card"><p>Unknown dialog type</p></div>';
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(config.title)}</title>
  <style>${getBaseStyles()}</style>
</head>
<body>
  ${body}
</body>
</html>`;
}
