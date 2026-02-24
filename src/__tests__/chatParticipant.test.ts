/**
 * Unit tests for the @human chat participant.
 */

import * as vscode from 'vscode';
import {
  handleInputCommand,
  handleChoiceCommand,
  handleMultilineCommand,
  handleConfirmCommand,
  handleInfoCommand,
  handleHealthCommand,
  createRequestHandler,
  registerChatParticipant,
} from '../chatParticipant';
import { showDialog } from '../webview';

// Mock platform module
jest.mock('../platform', () => ({
  getPlatformInfo: () => ({
    platform: 'linux',
    osName: 'Linux',
    isWindows: false,
    isMacOS: false,
    isLinux: true,
    isWSL: false,
    arch: 'x64',
    release: '5.15.0',
    hostname: 'test-host',
  }),
}));

// Mock os
jest.mock('os', () => ({
  platform: () => 'linux',
  arch: () => 'x64',
  release: () => '5.15.0',
  hostname: () => 'test-host',
}));

// Mock the webview dialog (tools now use showDialog instead of native VS Code APIs)
jest.mock('../webview', () => ({
  showDialog: jest.fn(),
}));

const mockShowDialog = showDialog as jest.MockedFunction<typeof showDialog>;

describe('Chat Participant Commands', () => {
  const mockToken: vscode.CancellationToken = {
    isCancellationRequested: false,
    onCancellationRequested: jest.fn(() => ({ dispose: jest.fn() })),
  };

  const createStream = () => ({
    markdown: jest.fn(),
    anchor: jest.fn(),
    button: jest.fn(),
    filetree: jest.fn(),
    progress: jest.fn(),
    reference: jest.fn(),
    push: jest.fn(),
    warning: jest.fn(),
    textEdit: jest.fn(),
    codeblockUri: jest.fn(),
    codeCitation: jest.fn(),
    confirmation: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (mockToken as { isCancellationRequested: boolean }).isCancellationRequested = false;
  });

  describe('handleInputCommand', () => {
    it('should show user input result on success', async () => {
      mockShowDialog.mockResolvedValue({ action: 'submit', value: 'hello' });
      const stream = createStream();

      await handleInputCommand(
        { prompt: 'Enter your name', command: 'input' } as vscode.ChatRequest,
        stream as unknown as vscode.ChatResponseStream,
        mockToken
      );

      expect(stream.markdown).toHaveBeenCalledWith('Opening input dialog...\n\n');
      expect(stream.markdown).toHaveBeenCalledWith('**User provided:** hello\n');
    });

    it('should show cancelled message when user cancels', async () => {
      mockShowDialog.mockResolvedValue({ action: 'cancel' });
      const stream = createStream();

      await handleInputCommand(
        { prompt: '', command: 'input' } as vscode.ChatRequest,
        stream as unknown as vscode.ChatResponseStream,
        mockToken
      );

      expect(stream.markdown).toHaveBeenCalledWith('*Input was cancelled by user.*\n');
    });

    it('should use default prompt when empty', async () => {
      mockShowDialog.mockResolvedValue({ action: 'submit', value: 'test' });
      const stream = createStream();

      await handleInputCommand(
        { prompt: '', command: 'input' } as vscode.ChatRequest,
        stream as unknown as vscode.ChatResponseStream,
        mockToken
      );

      expect(mockShowDialog).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: 'Please provide your input' }),
        mockToken
      );
    });
  });

  describe('handleChoiceCommand', () => {
    it('should show selected choice on success', async () => {
      mockShowDialog.mockResolvedValue({ action: 'submit', value: 'React' });
      const stream = createStream();

      await handleChoiceCommand(
        { prompt: 'React, Vue, Angular', command: 'choice' } as vscode.ChatRequest,
        stream as unknown as vscode.ChatResponseStream,
        mockToken
      );

      expect(stream.markdown).toHaveBeenCalledWith('Presenting 3 choices...\n\n');
      expect(stream.markdown).toHaveBeenCalledWith('**User selected:** React\n');
    });

    it('should show help when no prompt provided', async () => {
      const stream = createStream();

      await handleChoiceCommand(
        { prompt: '', command: 'choice' } as vscode.ChatRequest,
        stream as unknown as vscode.ChatResponseStream,
        mockToken
      );

      expect(stream.markdown).toHaveBeenCalledWith(
        expect.stringContaining('Please provide choices separated by commas')
      );
    });

    it('should show help when fewer than 2 choices', async () => {
      const stream = createStream();

      await handleChoiceCommand(
        { prompt: 'OnlyOne', command: 'choice' } as vscode.ChatRequest,
        stream as unknown as vscode.ChatResponseStream,
        mockToken
      );

      expect(stream.markdown).toHaveBeenCalledWith(
        expect.stringContaining('Please provide at least 2 choices')
      );
    });

    it('should show cancelled message when user cancels', async () => {
      mockShowDialog.mockResolvedValue({ action: 'cancel' });
      const stream = createStream();

      await handleChoiceCommand(
        { prompt: 'A, B, C', command: 'choice' } as vscode.ChatRequest,
        stream as unknown as vscode.ChatResponseStream,
        mockToken
      );

      expect(stream.markdown).toHaveBeenCalledWith('*Selection was cancelled by user.*\n');
    });
  });

  describe('handleMultilineCommand', () => {
    it('should show submitted text on success', async () => {
      mockShowDialog.mockResolvedValue({ action: 'submit', value: 'Hello World' });
      const stream = createStream();

      await handleMultilineCommand(
        { prompt: 'Enter feedback', command: 'multiline' } as vscode.ChatRequest,
        stream as unknown as vscode.ChatResponseStream,
        mockToken
      );

      expect(stream.markdown).toHaveBeenCalledWith('Opening multi-line editor...\n\n');
      expect(stream.markdown).toHaveBeenCalledWith(
        expect.stringContaining('Hello World')
      );
    });

    it('should show cancelled message when user cancels', async () => {
      mockShowDialog.mockResolvedValue({ action: 'cancel' });
      const stream = createStream();

      await handleMultilineCommand(
        { prompt: '', command: 'multiline' } as vscode.ChatRequest,
        stream as unknown as vscode.ChatResponseStream,
        mockToken
      );

      expect(stream.markdown).toHaveBeenCalledWith('*Multi-line input was cancelled by user.*\n');
    });
  });

  describe('handleConfirmCommand', () => {
    it('should show confirmed message when user says yes', async () => {
      mockShowDialog.mockResolvedValue({ action: 'submit', value: 'yes' });
      const stream = createStream();

      await handleConfirmCommand(
        { prompt: 'Delete all files?', command: 'confirm' } as vscode.ChatRequest,
        stream as unknown as vscode.ChatResponseStream,
        mockToken
      );

      expect(stream.markdown).toHaveBeenCalledWith('Showing confirmation dialog...\n\n');
      expect(stream.markdown).toHaveBeenCalledWith(expect.stringContaining('Yes'));
    });

    it('should show declined message when user says no', async () => {
      mockShowDialog.mockResolvedValue({ action: 'submit', value: 'no' });
      const stream = createStream();

      await handleConfirmCommand(
        { prompt: 'Continue?', command: 'confirm' } as vscode.ChatRequest,
        stream as unknown as vscode.ChatResponseStream,
        mockToken
      );

      expect(stream.markdown).toHaveBeenCalledWith(expect.stringContaining('No'));
    });

    it('should use default message when prompt is empty', async () => {
      mockShowDialog.mockResolvedValue({ action: 'submit', value: 'yes' });
      const stream = createStream();

      await handleConfirmCommand(
        { prompt: '', command: 'confirm' } as vscode.ChatRequest,
        stream as unknown as vscode.ChatResponseStream,
        mockToken
      );

      expect(mockShowDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'confirmation',
          message: 'Do you want to proceed?',
        })
      );
    });
  });

  describe('handleInfoCommand', () => {
    it('should show acknowledged message on success', async () => {
      mockShowDialog.mockResolvedValue({ action: 'submit', value: 'ok' });
      const stream = createStream();

      await handleInfoCommand(
        { prompt: 'Task completed!', command: 'info' } as vscode.ChatRequest,
        stream as unknown as vscode.ChatResponseStream,
        mockToken
      );

      expect(stream.markdown).toHaveBeenCalledWith('Message acknowledged by user. ✓\n');
    });

    it('should show dismissed message when not acknowledged', async () => {
      mockShowDialog.mockResolvedValue({ action: 'cancel' });
      const stream = createStream();

      await handleInfoCommand(
        { prompt: 'Some info', command: 'info' } as vscode.ChatRequest,
        stream as unknown as vscode.ChatResponseStream,
        mockToken
      );

      expect(stream.markdown).toHaveBeenCalledWith('Message was dismissed.\n');
    });

    it('should show help when no message provided', async () => {
      const stream = createStream();

      await handleInfoCommand(
        { prompt: '', command: 'info' } as vscode.ChatRequest,
        stream as unknown as vscode.ChatResponseStream,
        mockToken
      );

      expect(stream.markdown).toHaveBeenCalledWith(
        expect.stringContaining('Please provide a message to display')
      );
    });
  });

  describe('handleHealthCommand', () => {
    it('should show health check table', async () => {
      const stream = createStream();

      await handleHealthCommand(stream as unknown as vscode.ChatResponseStream);

      expect(stream.markdown).toHaveBeenCalledWith(
        expect.stringContaining('Health Check')
      );
      expect(stream.markdown).toHaveBeenCalledWith(
        expect.stringContaining('healthy')
      );
    });
  });

  describe('createRequestHandler', () => {
    const handler = createRequestHandler();
    const mockContext = { history: [] } as unknown as vscode.ChatContext;

    it('should route /input command', async () => {
      mockShowDialog.mockResolvedValue({ action: 'submit', value: 'test' });
      const stream = createStream();

      await handler(
        { command: 'input', prompt: 'Enter name' } as vscode.ChatRequest,
        mockContext,
        stream as unknown as vscode.ChatResponseStream,
        mockToken
      );

      expect(mockShowDialog).toHaveBeenCalled();
    });

    it('should route /choice command', async () => {
      mockShowDialog.mockResolvedValue({ action: 'submit', value: 'A' });
      const stream = createStream();

      await handler(
        { command: 'choice', prompt: 'A, B' } as vscode.ChatRequest,
        mockContext,
        stream as unknown as vscode.ChatResponseStream,
        mockToken
      );

      expect(mockShowDialog).toHaveBeenCalled();
    });

    it('should route /confirm command', async () => {
      mockShowDialog.mockResolvedValue({ action: 'submit', value: 'yes' });
      const stream = createStream();

      await handler(
        { command: 'confirm', prompt: 'Sure?' } as vscode.ChatRequest,
        mockContext,
        stream as unknown as vscode.ChatResponseStream,
        mockToken
      );

      expect(mockShowDialog).toHaveBeenCalled();
    });

    it('should show help when no command and empty prompt', async () => {
      const stream = createStream();

      await handler(
        { command: undefined, prompt: '' } as unknown as vscode.ChatRequest,
        mockContext,
        stream as unknown as vscode.ChatResponseStream,
        mockToken
      );

      expect(stream.markdown).toHaveBeenCalledWith(
        expect.stringContaining('@human — Human in the Loop')
      );
      // Verify help includes Agent mode guidance
      expect(stream.markdown).toHaveBeenCalledWith(
        expect.stringContaining('Agent Mode (recommended)')
      );
      // Verify help includes # tool reference guidance
      expect(stream.markdown).toHaveBeenCalledWith(
        expect.stringContaining('#human_getUserInput')
      );
    });

    it('should auto-invoke simple input when no command but prompt given', async () => {
      mockShowDialog.mockResolvedValue({ action: 'submit', value: 'user response text' });
      const stream = createStream();

      await handler(
        { command: undefined, prompt: 'What framework do you prefer?' } as unknown as vscode.ChatRequest,
        mockContext,
        stream as unknown as vscode.ChatResponseStream,
        mockToken
      );

      // Should have opened simple input, not multiline or help
      expect(stream.markdown).toHaveBeenCalledWith(
        expect.stringContaining('Opening input dialog')
      );
    });

    it('should show help text with Quick Start section', async () => {
      const stream = createStream();

      await handler(
        { command: undefined, prompt: '  ' } as unknown as vscode.ChatRequest,
        mockContext,
        stream as unknown as vscode.ChatResponseStream,
        mockToken
      );

      expect(stream.markdown).toHaveBeenCalledWith(
        expect.stringContaining('Quick Start')
      );
    });

    it('should return empty ChatResult', async () => {
      const stream = createStream();

      const result = await handler(
        { command: 'health', prompt: '' } as vscode.ChatRequest,
        mockContext,
        stream as unknown as vscode.ChatResponseStream,
        mockToken
      );

      expect(result).toEqual({});
    });
  });

  describe('registerChatParticipant', () => {
    it('should register participant with correct ID', () => {
      const mockDisposables: { dispose: jest.Mock }[] = [];
      const mockContext = {
        subscriptions: {
          push: jest.fn((d: { dispose: jest.Mock }) => mockDisposables.push(d)),
        },
      } as unknown as vscode.ExtensionContext;

      registerChatParticipant(mockContext);

      expect(vscode.chat.createChatParticipant).toHaveBeenCalledWith(
        'human-in-the-loop.human',
        expect.any(Function)
      );
      expect(mockContext.subscriptions.push).toHaveBeenCalled();
    });
  });
});
