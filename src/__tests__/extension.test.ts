/**
 * Tests for extension.ts — activate, createTool, createSimpleTool, prepareInvocation.
 *
 * Note: We do NOT call jest.mock('vscode') here because moduleNameMapper already
 * resolves 'vscode' to our manual mock. Calling jest.mock would auto-mock on top
 * of our mock, turning class constructors (LanguageModelToolResult) into no-ops.
 */

import * as vscode from 'vscode';
import { activate, deactivate } from '../extension';
import { showDialog } from '../webview';

// Mock the webview dialog (tools now use showDialog instead of native VS Code APIs)
jest.mock('../webview', () => ({
  showDialog: jest.fn(),
}));

const mockShowDialog = showDialog as jest.MockedFunction<typeof showDialog>;

// Helper to capture the registered tool objects
function getRegisteredTools(): Map<string, vscode.LanguageModelTool<Record<string, unknown>>> {
  const tools = new Map<string, vscode.LanguageModelTool<Record<string, unknown>>>();
  const calls = (vscode.lm.registerTool as jest.Mock).mock.calls;
  for (const [name, tool] of calls) {
    tools.set(name, tool);
  }
  return tools;
}

/**
 * After jest.clearAllMocks(), createChatParticipant returns undefined.
 * Re-mock it to return a proper participant object so activate() doesn't throw.
 */
function reMockCreateChatParticipant(): void {
  (vscode.chat.createChatParticipant as jest.Mock).mockReturnValue({
    iconPath: undefined as unknown,
    dispose: jest.fn(),
  });
}

describe('Extension activation', () => {
  let mockContext: vscode.ExtensionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    reMockCreateChatParticipant();
    mockContext = {
      subscriptions: [],
      extensionPath: '/test',
      extensionUri: vscode.Uri.file('/test'),
      storageUri: undefined,
      globalStorageUri: vscode.Uri.file('/test/global'),
      logUri: vscode.Uri.file('/test/log'),
      extensionMode: 1,
      extension: {} as unknown,
      environmentVariableCollection: {} as unknown,
      secrets: {} as unknown,
      storagePath: '/test/storage',
      globalStoragePath: '/test/global-storage',
      logPath: '/test/log',
      asAbsolutePath: jest.fn((p: string) => `/test/${p}`),
      workspaceState: { get: jest.fn(), update: jest.fn(), keys: jest.fn() } as unknown as vscode.Memento,
      globalState: {
        get: jest.fn(),
        update: jest.fn(),
        keys: jest.fn(),
        setKeysForSync: jest.fn(),
      } as unknown as vscode.Memento & { setKeysForSync(keys: readonly string[]): void },
      languageModelAccessInformation: {} as unknown,
    } as unknown as vscode.ExtensionContext;
  });

  it('should register 6 chat tools', () => {
    activate(mockContext);
    expect(vscode.lm.registerTool).toHaveBeenCalledTimes(6);
  });

  it('should register chat participant', () => {
    activate(mockContext);
    expect(vscode.chat.createChatParticipant).toHaveBeenCalledTimes(1);
    expect(vscode.chat.createChatParticipant).toHaveBeenCalledWith(
      'human-in-the-loop.human',
      expect.any(Function)
    );
  });

  it('should register tools with correct names', () => {
    activate(mockContext);
    const expectedNames = [
      'human_getUserInput',
      'human_getUserChoice',
      'human_getMultilineInput',
      'human_showConfirmation',
      'human_showInfoMessage',
      'human_healthCheck',
    ];
    const calls = (vscode.lm.registerTool as jest.Mock).mock.calls;
    const registeredNames = calls.map(([name]: [string]) => name);
    expect(registeredNames).toEqual(expectedNames);
  });

  it('should add disposables to subscriptions', () => {
    activate(mockContext);
    // 6 tools (each registerTool returns a disposable via mock) + 1 chat participant
    // The subscriptions.push is called with multiple args
    expect(mockContext.subscriptions.length).toBeGreaterThan(0);
  });

  it('deactivate should not throw', () => {
    expect(() => deactivate()).not.toThrow();
  });
});

describe('Tool wrappers — prepareInvocation', () => {
  let tools: Map<string, vscode.LanguageModelTool<Record<string, unknown>>>;

  beforeAll(() => {
    jest.clearAllMocks();
    reMockCreateChatParticipant();
    const ctx = {
      subscriptions: [],
      extensionPath: '/test',
      extensionUri: vscode.Uri.file('/test'),
      storageUri: undefined,
      globalStorageUri: vscode.Uri.file('/test/global'),
      logUri: vscode.Uri.file('/test/log'),
      extensionMode: 1,
      extension: {} as unknown,
      environmentVariableCollection: {} as unknown,
      secrets: {} as unknown,
      storagePath: '/test/storage',
      globalStoragePath: '/test/global-storage',
      logPath: '/test/log',
      asAbsolutePath: jest.fn((p: string) => `/test/${p}`),
      workspaceState: { get: jest.fn(), update: jest.fn(), keys: jest.fn() } as unknown as vscode.Memento,
      globalState: {
        get: jest.fn(),
        update: jest.fn(),
        keys: jest.fn(),
        setKeysForSync: jest.fn(),
      } as unknown as vscode.Memento & { setKeysForSync(keys: readonly string[]): void },
      languageModelAccessInformation: {} as unknown,
    } as unknown as vscode.ExtensionContext;
    activate(ctx);
    tools = getRegisteredTools();
  });

  it.each([
    ['human_getUserInput', 'Asking user for input…'],
    ['human_getUserChoice', 'Presenting choices to user…'],
    ['human_getMultilineInput', 'Opening multi-line editor for user…'],
    ['human_showConfirmation', 'Asking user for confirmation…'],
    ['human_showInfoMessage', 'Showing message to user…'],
    ['human_healthCheck', 'Checking extension health…'],
  ])('%s should have prepareInvocation returning invocationMessage', (name, expectedMessage) => {
    const tool = tools.get(name)!;
    expect(tool).toBeDefined();
    expect(tool.prepareInvocation).toBeDefined();

    const token = new vscode.CancellationTokenSource().token;
    const result = tool.prepareInvocation!(
      { input: {} } as vscode.LanguageModelToolInvocationPrepareOptions<Record<string, unknown>>,
      token as vscode.CancellationToken
    );

    expect(result).toEqual({ invocationMessage: expectedMessage });
  });
});

describe('Tool wrappers — invoke', () => {
  let tools: Map<string, vscode.LanguageModelTool<Record<string, unknown>>>;

  beforeAll(() => {
    jest.clearAllMocks();
    reMockCreateChatParticipant();
    const ctx = {
      subscriptions: [],
      extensionPath: '/test',
      extensionUri: vscode.Uri.file('/test'),
      storageUri: undefined,
      globalStorageUri: vscode.Uri.file('/test/global'),
      logUri: vscode.Uri.file('/test/log'),
      extensionMode: 1,
      extension: {} as unknown,
      environmentVariableCollection: {} as unknown,
      secrets: {} as unknown,
      storagePath: '/test/storage',
      globalStoragePath: '/test/global-storage',
      logPath: '/test/log',
      asAbsolutePath: jest.fn((p: string) => `/test/${p}`),
      workspaceState: { get: jest.fn(), update: jest.fn(), keys: jest.fn() } as unknown as vscode.Memento,
      globalState: {
        get: jest.fn(),
        update: jest.fn(),
        keys: jest.fn(),
        setKeysForSync: jest.fn(),
      } as unknown as vscode.Memento & { setKeysForSync(keys: readonly string[]): void },
      languageModelAccessInformation: {} as unknown,
    } as unknown as vscode.ExtensionContext;
    activate(ctx);
    tools = getRegisteredTools();
  });

  // Helper to create invoke options with toolInvocationToken
  function makeOptions(input: Record<string, unknown>): vscode.LanguageModelToolInvocationOptions<Record<string, unknown>> {
    return {
      input,
      toolInvocationToken: undefined,
    } as unknown as vscode.LanguageModelToolInvocationOptions<Record<string, unknown>>;
  }

  it('healthCheck invoke should return LanguageModelToolResult', async () => {
    const tool = tools.get('human_healthCheck')!;
    const token = new vscode.CancellationTokenSource().token;

    const result = await tool.invoke(makeOptions({}), token as vscode.CancellationToken);

    // Result should be a LanguageModelToolResult with content array
    expect(result).toBeDefined();
    const content = (result as unknown as { content: vscode.LanguageModelTextPart[] }).content;
    expect(content).toBeDefined();
    expect(content.length).toBe(1);

    // Formatted text instead of raw JSON
    const text = content[0].value;
    expect(text).toContain('**Status:** healthy');
    expect(text).toContain('**Available tools:**');
  });

  it('getUserInput invoke should call showDialog and return result', async () => {
    const tool = tools.get('human_getUserInput')!;
    const token = new vscode.CancellationTokenSource().token;

    mockShowDialog.mockResolvedValueOnce({ action: 'submit', value: 'test answer' });

    const result = await tool.invoke(
      makeOptions({ title: 'Test', prompt: 'Enter something', inputType: 'text' }),
      token as vscode.CancellationToken
    );

    const content = (result as unknown as { content: vscode.LanguageModelTextPart[] }).content;
    // Formatted text instead of raw JSON
    const text = content[0].value;
    expect(text).toContain('**Result:**');
    expect(text).toContain('test answer');
  });

  it('getUserChoice invoke should call showDialog and return result', async () => {
    const tool = tools.get('human_getUserChoice')!;
    const token = new vscode.CancellationTokenSource().token;

    mockShowDialog.mockResolvedValueOnce({ action: 'submit', value: 'Option A' });

    const result = await tool.invoke(
      makeOptions({ title: 'Test', prompt: 'Pick one', choices: ['Option A', 'Option B'], allowMultiple: false }),
      token as vscode.CancellationToken
    );

    const content = (result as unknown as { content: vscode.LanguageModelTextPart[] }).content;
    // Formatted text instead of raw JSON
    const text = content[0].value;
    expect(text).toContain('**Result:**');
    expect(text).toContain('**Option A**');
  });

  it('showConfirmation invoke returns confirmation result', async () => {
    const tool = tools.get('human_showConfirmation')!;
    const token = new vscode.CancellationTokenSource().token;

    mockShowDialog.mockResolvedValueOnce({ action: 'submit', value: 'yes' });

    const result = await tool.invoke(
      makeOptions({ title: 'Confirm', message: 'Are you sure?' }),
      token as vscode.CancellationToken
    );

    const content = (result as unknown as { content: vscode.LanguageModelTextPart[] }).content;
    // Formatted text instead of raw JSON
    const text = content[0].value;
    expect(text).toContain('**Result:**');
    expect(text).toContain('**Yes**');
  });

  it('invoke with empty input defaults to empty object', async () => {
    const tool = tools.get('human_healthCheck')!;
    const token = new vscode.CancellationTokenSource().token;

    // Pass undefined input to verify the ?? {} fallback
    const result = await tool.invoke(
      { input: undefined, toolInvocationToken: undefined } as unknown as vscode.LanguageModelToolInvocationOptions<Record<string, unknown>>,
      token as vscode.CancellationToken
    );

    const content = (result as unknown as { content: vscode.LanguageModelTextPart[] }).content;
    // Formatted text instead of raw JSON
    const text = content[0].value;
    expect(text).toContain('**Status:** healthy');
  });
});
