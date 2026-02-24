/**
 * Comprehensive VS Code API mock for unit testing.
 * Mocks all VS Code APIs used by the extension.
 */

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace window {
  export const showInputBox = jest.fn();
  export const showQuickPick = jest.fn();
  export const showInformationMessage = jest.fn();
  export const showWarningMessage = jest.fn();
  export const showErrorMessage = jest.fn();
  export const createOutputChannel = jest.fn(() => ({
    appendLine: jest.fn(),
    append: jest.fn(),
    clear: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    dispose: jest.fn(),
  }));
  export const showTextDocument = jest.fn();
  export const createTextEditorDecorationType = jest.fn();

  /**
   * Mock factory for webview panels used by WebviewDialogManager.
   * Each call returns a fresh panel mock with its own message listeners.
   */
  export const createWebviewPanel = jest.fn(() => {
    let _onDidReceiveMessageCallback: ((msg: unknown) => void) | undefined;
    let _onDidDisposeCallback: (() => void) | undefined;
    let _html = '';
    return {
      webview: {
        get html() { return _html; },
        set html(value: string) { _html = value; },
        onDidReceiveMessage: jest.fn((callback: (msg: unknown) => void) => {
          _onDidReceiveMessageCallback = callback;
          return { dispose: jest.fn() };
        }),
        postMessage: jest.fn(),
        asWebviewUri: jest.fn((uri: unknown) => uri),
        cspSource: 'mock-csp',
      },
      onDidDispose: jest.fn((callback: () => void) => {
        _onDidDisposeCallback = callback;
        return { dispose: jest.fn() };
      }),
      dispose: jest.fn(),
      reveal: jest.fn(),
      visible: true,
      // Test helpers — simulate user interactions from tests
      _simulateMessage(msg: unknown) {
        _onDidReceiveMessageCallback?.(msg);
      },
      _simulateDispose() {
        _onDidDisposeCallback?.();
      },
    };
  });
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace workspace {
  export const openTextDocument = jest.fn();
  export const getConfiguration = jest.fn(() => ({
    get: jest.fn(),
    update: jest.fn(),
    has: jest.fn(),
    inspect: jest.fn(),
  }));
  export const onDidCloseTextDocument = jest.fn();
  export const onDidChangeTextDocument = jest.fn();
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace commands {
  export const registerCommand = jest.fn();
  export const executeCommand = jest.fn();
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace env {
  export const machineId = 'test-machine-id';
  export const sessionId = 'test-session-id';
  export const language = 'en';
  export const appName = 'VS Code';
  export const appRoot = '/test/app/root';
  export const uriScheme = 'vscode';
  export const clipboard = {
    readText: jest.fn(),
    writeText: jest.fn(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace extensions {
  export const getExtension = jest.fn();
  export const all: unknown[] = [];
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace lm {
  export const registerTool = jest.fn();
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace chat {
  export const createChatParticipant = jest.fn(() => ({
    iconPath: undefined as unknown,
    dispose: jest.fn(),
  }));
}

export class Uri {
  static parse = jest.fn((value: string) => ({
    scheme: 'file',
    authority: '',
    path: value,
    query: '',
    fragment: '',
    fsPath: value,
    with: jest.fn(),
    toString: () => value,
  }));
  static file = jest.fn((path: string) => ({
    scheme: 'file',
    authority: '',
    path,
    query: '',
    fragment: '',
    fsPath: path,
    with: jest.fn(),
    toString: () => `file://${path}`,
  }));
}

export class Disposable {
  static from(...disposables: { dispose(): unknown }[]): Disposable {
    return new Disposable(() => {
      disposables.forEach((d) => d.dispose());
    });
  }
  constructor(private callOnDispose: () => unknown) {}
  dispose(): void {
    this.callOnDispose();
  }
}

export class CancellationTokenSource {
  token = {
    isCancellationRequested: false,
    onCancellationRequested: jest.fn(),
  };
  cancel = jest.fn();
  dispose = jest.fn();
}

export enum QuickPickItemKind {
  Separator = -1,
  Default = 0,
}

export enum ViewColumn {
  Active = -1,
  Beside = -2,
  One = 1,
  Two = 2,
  Three = 3,
}

export class LanguageModelTextPart {
  constructor(public value: string) {}
}

export class LanguageModelToolResultPart {
  constructor(public value: unknown) {}
}

export class LanguageModelToolResult {
  constructor(public content: (LanguageModelTextPart | LanguageModelToolResultPart)[]) {}
}

export class ThemeIcon {
  constructor(public id: string) {}
}

// Default export for module mock
const vscode = {
  window,
  workspace,
  commands,
  env,
  extensions,
  lm,
  chat,
  Uri,
  Disposable,
  CancellationTokenSource,
  QuickPickItemKind,
  ViewColumn,
  LanguageModelTextPart,
  LanguageModelToolResultPart,
  LanguageModelToolResult,
  ThemeIcon,
};

export default vscode;
