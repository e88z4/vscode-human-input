/**
 * Unit tests for getHtml.ts — HTML/CSS generation for webview dialogs.
 */

import { getDialogHtml, DialogConfig } from '../webview/getHtml';
import { markdownToHtml, escapeHtml } from '../webview/getHtml';

describe('getDialogHtml', () => {
  describe('input dialog', () => {
    it('should generate HTML with input field', () => {
      const config: DialogConfig = {
        type: 'input',
        title: 'Enter Name',
        prompt: 'What is your name?',
      };
      const html = getDialogHtml(config);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Enter Name');
      expect(html).toContain('What is your name?');
      expect(html).toContain('input');
      expect(html).toContain('type="text"');
      expect(html).toContain('✏️');
    });

    it('should set number input for integer type', () => {
      const config: DialogConfig = {
        type: 'input',
        title: 'Count',
        prompt: 'Enter count',
        inputType: 'integer',
      };
      const html = getDialogHtml(config);

      expect(html).toContain('type="number"');
      expect(html).toContain('step="1"');
      expect(html).toContain('Expected: integer');
    });

    it('should set number input with any step for float type', () => {
      const config: DialogConfig = {
        type: 'input',
        title: 'Price',
        prompt: 'Enter price',
        inputType: 'float',
      };
      const html = getDialogHtml(config);

      expect(html).toContain('type="number"');
      expect(html).toContain('step="any"');
      expect(html).toContain('Expected: float');
    });

    it('should include default value', () => {
      const config: DialogConfig = {
        type: 'input',
        title: 'Name',
        prompt: 'Enter name',
        defaultValue: 'John',
      };
      const html = getDialogHtml(config);

      expect(html).toContain('value="John"');
    });

    it('should include integer validation script', () => {
      const config: DialogConfig = {
        type: 'input',
        title: 'Count',
        prompt: 'Enter count',
        inputType: 'integer',
      };
      const html = getDialogHtml(config);

      expect(html).toContain('parseInt');
    });

    it('should include float validation script', () => {
      const config: DialogConfig = {
        type: 'input',
        title: 'Price',
        prompt: 'Enter price',
        inputType: 'float',
      };
      const html = getDialogHtml(config);

      expect(html).toContain('parseFloat');
    });

    it('should not show type hint for text type', () => {
      const config: DialogConfig = {
        type: 'input',
        title: 'Name',
        prompt: 'Enter name',
        inputType: 'text',
      };
      const html = getDialogHtml(config);

      // text type should not have the "Expected: text" hint
      expect(html).not.toContain('Expected: text');
    });
  });

  describe('choice dialog', () => {
    it('should generate radio buttons for single select', () => {
      const config: DialogConfig = {
        type: 'choice',
        title: 'Framework',
        prompt: 'Choose framework',
        choices: ['React', 'Vue', 'Angular'],
        allowMultiple: false,
      };
      const html = getDialogHtml(config);

      expect(html).toContain('type="radio"');
      expect(html).toContain('React');
      expect(html).toContain('Vue');
      expect(html).toContain('Angular');
      expect(html).toContain('📋');
      expect(html).not.toContain('select one or more');
    });

    it('should generate checkboxes for multi select', () => {
      const config: DialogConfig = {
        type: 'choice',
        title: 'Frameworks',
        prompt: 'Choose frameworks',
        choices: ['React', 'Vue'],
        allowMultiple: true,
      };
      const html = getDialogHtml(config);

      expect(html).toContain('type="checkbox"');
      expect(html).toContain('select one or more');
      expect(html).toContain('isMultiple = true');
    });

    it('should handle empty choices array', () => {
      const config: DialogConfig = {
        type: 'choice',
        title: 'Test',
        prompt: 'Choose',
        choices: [],
      };
      const html = getDialogHtml(config);

      expect(html).toContain('choice-list');
      expect(html).not.toContain('choice_0');
    });

    it('should handle undefined choices', () => {
      const config: DialogConfig = {
        type: 'choice',
        title: 'Test',
        prompt: 'Choose',
      };
      const html = getDialogHtml(config);

      expect(html).toContain('choice-list');
    });
  });

  describe('multiline dialog', () => {
    it('should generate textarea', () => {
      const config: DialogConfig = {
        type: 'multiline',
        title: 'Feedback',
        prompt: 'Share your thoughts',
      };
      const html = getDialogHtml(config);

      expect(html).toContain('textarea');
      expect(html).toContain('Feedback');
      expect(html).toContain('📝');
    });

    it('should include default value in textarea', () => {
      const config: DialogConfig = {
        type: 'multiline',
        title: 'Note',
        prompt: 'Edit note',
        defaultValue: 'Line 1\nLine 2',
      };
      const html = getDialogHtml(config);

      expect(html).toContain('Line 1\nLine 2');
    });
  });

  describe('confirmation dialog', () => {
    it('should generate Yes/No buttons', () => {
      const config: DialogConfig = {
        type: 'confirmation',
        title: 'Delete',
        prompt: 'Are you sure?',
        message: 'This cannot be undone',
      };
      const html = getDialogHtml(config);

      expect(html).toContain('Yes');
      expect(html).toContain('No');
      expect(html).toContain('⚠️');
      expect(html).toContain('This cannot be undone');
      expect(html).toContain('confirm-message');
    });

    it('should use prompt as message fallback', () => {
      const config: DialogConfig = {
        type: 'confirmation',
        title: 'Confirm',
        prompt: 'Proceed?',
      };
      const html = getDialogHtml(config);

      expect(html).toContain('Proceed?');
    });
  });

  describe('info dialog', () => {
    it('should generate OK button', () => {
      const config: DialogConfig = {
        type: 'info',
        title: 'Success',
        prompt: 'Task completed',
        message: 'All files processed',
      };
      const html = getDialogHtml(config);

      expect(html).toContain('OK');
      expect(html).toContain('ℹ️');
      expect(html).toContain('All files processed');
      expect(html).toContain('info-message');
    });

    it('should use prompt as message fallback', () => {
      const config: DialogConfig = {
        type: 'info',
        title: 'Info',
        prompt: 'Done!',
      };
      const html = getDialogHtml(config);

      // prompt appears in both dialog-prompt and info-message
      expect(html).toContain('Done!');
    });
  });

  describe('unknown dialog type', () => {
    it('should generate unknown dialog type message', () => {
      const config = {
        type: 'unknown' as 'input',
        title: 'Test',
        prompt: 'Test',
      };
      const html = getDialogHtml(config);

      expect(html).toContain('Unknown dialog type');
    });
  });

  describe('XSS prevention', () => {
    it('should escape HTML in title', () => {
      const config: DialogConfig = {
        type: 'input',
        title: '<script>alert("xss")</script>',
        prompt: 'Test',
      };
      const html = getDialogHtml(config);

      expect(html).not.toContain('<script>alert("xss")</script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should escape HTML in prompt', () => {
      const config: DialogConfig = {
        type: 'input',
        title: 'Test',
        prompt: '<img onerror="alert(1)">',
      };
      const html = getDialogHtml(config);

      expect(html).not.toContain('<img onerror');
      expect(html).toContain('&lt;img');
    });

    it('should escape HTML in choices', () => {
      const config: DialogConfig = {
        type: 'choice',
        title: 'Test',
        prompt: 'Choose',
        choices: ['<b>Bold</b>', 'Normal'],
      };
      const html = getDialogHtml(config);

      expect(html).not.toContain('<b>Bold</b>');
      expect(html).toContain('&lt;b&gt;Bold&lt;/b&gt;');
    });

    it('should escape quotes in default value', () => {
      const config: DialogConfig = {
        type: 'input',
        title: 'Test',
        prompt: 'Enter',
        defaultValue: 'value "with" quotes',
      };
      const html = getDialogHtml(config);

      expect(html).toContain('&quot;with&quot;');
    });

    it('should escape ampersands', () => {
      const config: DialogConfig = {
        type: 'info',
        title: 'Test & More',
        prompt: 'Info',
        message: 'A & B',
      };
      const html = getDialogHtml(config);

      expect(html).toContain('Test &amp; More');
      expect(html).toContain('A &amp; B');
    });

    it('should escape single quotes', () => {
      const config: DialogConfig = {
        type: 'input',
        title: "It's a test",
        prompt: 'Enter',
      };
      const html = getDialogHtml(config);

      expect(html).toContain('It&#39;s a test');
    });
  });

  describe('common HTML structure', () => {
    it('should include meta charset', () => {
      const config: DialogConfig = { type: 'input', title: 'T', prompt: 'P' };
      const html = getDialogHtml(config);

      expect(html).toContain('<meta charset="UTF-8"');
    });

    it('should include viewport meta', () => {
      const config: DialogConfig = { type: 'input', title: 'T', prompt: 'P' };
      const html = getDialogHtml(config);

      expect(html).toContain('viewport');
    });

    it('should include VS Code CSS variables', () => {
      const config: DialogConfig = { type: 'input', title: 'T', prompt: 'P' };
      const html = getDialogHtml(config);

      expect(html).toContain('--vscode-foreground');
      expect(html).toContain('--vscode-editor-background');
      expect(html).toContain('--vscode-button-background');
    });

    it('should include dialog-card class', () => {
      const config: DialogConfig = { type: 'input', title: 'T', prompt: 'P' };
      const html = getDialogHtml(config);

      expect(html).toContain('dialog-card');
    });
  });

  describe('markdown rendering in info dialog', () => {
    it('should render headings as HTML', () => {
      const config: DialogConfig = {
        type: 'info',
        title: 'Plan',
        prompt: 'Review',
        message: '## My Heading\n### Sub Heading\nSome text',
      };
      const html = getDialogHtml(config);

      expect(html).toContain('<h2');
      expect(html).toContain('My Heading');
      expect(html).toContain('<h3');
      expect(html).toContain('Sub Heading');
    });

    it('should render bold text', () => {
      const config: DialogConfig = {
        type: 'info',
        title: 'Info',
        prompt: 'Check',
        message: 'This is **bold** text',
      };
      const html = getDialogHtml(config);

      expect(html).toContain('<strong>bold</strong>');
    });

    it('should render ordered lists', () => {
      const config: DialogConfig = {
        type: 'info',
        title: 'Steps',
        prompt: 'Plan',
        message: '1. First step\n2. Second step\n3. Third step',
      };
      const html = getDialogHtml(config);

      expect(html).toContain('<ol');
      expect(html).toContain('<li>First step</li>');
      expect(html).toContain('<li>Third step</li>');
    });

    it('should render unordered lists', () => {
      const config: DialogConfig = {
        type: 'info',
        title: 'Items',
        prompt: 'List',
        message: '- Alpha\n- Beta\n- Gamma',
      };
      const html = getDialogHtml(config);

      expect(html).toContain('<ul');
      expect(html).toContain('<li>Alpha</li>');
    });

    it('should render inline code', () => {
      const config: DialogConfig = {
        type: 'info',
        title: 'Code',
        prompt: 'Example',
        message: 'Run `npm install` to start',
      };
      const html = getDialogHtml(config);

      expect(html).toContain('<code');
      expect(html).toContain('npm install');
    });

    it('should render code blocks', () => {
      const config: DialogConfig = {
        type: 'info',
        title: 'Code',
        prompt: 'Example',
        message: '```\nconst x = 1;\n```',
      };
      const html = getDialogHtml(config);

      expect(html).toContain('<pre');
      expect(html).toContain('const x = 1;');
    });

    it('should render horizontal rules', () => {
      const config: DialogConfig = {
        type: 'info',
        title: 'Info',
        prompt: 'Test',
        message: 'Above\n---\nBelow',
      };
      const html = getDialogHtml(config);

      expect(html).toContain('<hr');
    });
  });

  describe('markdown rendering in confirmation dialog', () => {
    it('should render markdown in confirmation message', () => {
      const config: DialogConfig = {
        type: 'confirmation',
        title: 'Confirm',
        prompt: 'Proceed?',
        message: '## Warning\nThis will **delete** all files.\n\n1. Step one\n2. Step two',
      };
      const html = getDialogHtml(config);

      expect(html).toContain('<h2');
      expect(html).toContain('Warning');
      expect(html).toContain('<strong>delete</strong>');
      expect(html).toContain('<ol');
    });
  });
});

describe('escapeHtml', () => {
  it('escapes all special characters', () => {
    expect(escapeHtml('<script>"alert(\'xss\')&"</script>')).toBe(
      '&lt;script&gt;&quot;alert(&#39;xss&#39;)&amp;&quot;&lt;/script&gt;'
    );
  });
});

describe('markdownToHtml', () => {
  it('converts h1', () => {
    expect(markdownToHtml('# Title')).toContain('<h1');
    expect(markdownToHtml('# Title')).toContain('Title');
  });

  it('converts h2', () => {
    expect(markdownToHtml('## Section')).toContain('<h2');
  });

  it('converts h3', () => {
    expect(markdownToHtml('### Sub')).toContain('<h3');
  });

  it('converts h4', () => {
    expect(markdownToHtml('#### Detail')).toContain('<h4');
  });

  it('converts bold with **', () => {
    expect(markdownToHtml('**bold**')).toContain('<strong>bold</strong>');
  });

  it('converts bold with __', () => {
    expect(markdownToHtml('__bold__')).toContain('<strong>bold</strong>');
  });

  it('converts italic with *', () => {
    expect(markdownToHtml('*italic*')).toContain('<em>italic</em>');
  });

  it('converts inline code', () => {
    const result = markdownToHtml('use `npm test`');
    expect(result).toContain('<code');
    expect(result).toContain('npm test');
  });

  it('converts code blocks', () => {
    const result = markdownToHtml('```\ncode\n```');
    expect(result).toContain('<pre');
    expect(result).toContain('code');
  });

  it('converts unordered lists with -', () => {
    const result = markdownToHtml('- one\n- two');
    expect(result).toContain('<ul');
    expect(result).toContain('<li>one</li>');
    expect(result).toContain('<li>two</li>');
  });

  it('converts unordered lists with *', () => {
    const result = markdownToHtml('* alpha\n* beta');
    expect(result).toContain('<ul');
    expect(result).toContain('<li>alpha</li>');
  });

  it('converts ordered lists', () => {
    const result = markdownToHtml('1. first\n2. second');
    expect(result).toContain('<ol');
    expect(result).toContain('<li>first</li>');
  });

  it('closes lists properly when followed by non-list', () => {
    const result = markdownToHtml('- item\nParagraph');
    expect(result).toContain('</ul>');
    expect(result).toContain('Paragraph');
  });

  it('converts blockquotes', () => {
    const result = markdownToHtml('> quoted text');
    expect(result).toContain('<blockquote');
    expect(result).toContain('quoted text');
  });

  it('converts horizontal rules', () => {
    expect(markdownToHtml('---')).toContain('<hr');
    expect(markdownToHtml('-----')).toContain('<hr');
  });

  it('converts links', () => {
    const result = markdownToHtml('[click](https://example.com)');
    expect(result).toContain('<a href="https://example.com"');
    expect(result).toContain('>click</a>');
  });

  it('escapes HTML before converting markdown', () => {
    const result = markdownToHtml('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('handles empty lines as breaks', () => {
    const result = markdownToHtml('Para 1\n\nPara 2');
    expect(result).toContain('<br>');
  });

  it('handles complex mixed markdown', () => {
    const md = '## Plan\n\n1. Define **product**\n2. Create `main.tf`\n\n---\n\nDone!';
    const result = markdownToHtml(md);
    expect(result).toContain('<h2');
    expect(result).toContain('<strong>product</strong>');
    expect(result).toContain('<code');
    expect(result).toContain('<hr');
    expect(result).toContain('Done!');
  });
});
