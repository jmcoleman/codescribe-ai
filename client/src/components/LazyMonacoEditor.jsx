import { Editor } from '@monaco-editor/react';

/**
 * Monaco Editor wrapper component for lazy loading
 * This component is dynamically imported to reduce initial bundle size
 */
export function LazyMonacoEditor({ height, language, value, onChange, options, theme }) {
  // Define custom themes before mounting
  const handleEditorWillMount = (monaco) => {
    // Light theme
    monaco.editor.defineTheme('codescribe-light', {
      base: 'vs',
      inherit: false,
      rules: [
        // Default - slate
        { token: '', foreground: '334155' },

        // Comments - gray
        { token: 'comment', foreground: '94A3B8', fontStyle: 'italic' },

        // Keywords - purple (import, export, class, async, return, const, etc.)
        { token: 'keyword', foreground: '9333EA' },

        // Strings - green
        { token: 'string', foreground: '16A34A' },

        // Numbers - cyan
        { token: 'number', foreground: '0891B2' },

        // Punctuation - slate (all brackets, braces, parentheses, etc.)
        { token: 'delimiter', foreground: '334155' },
        { token: 'delimiter.curly', foreground: '334155' },
        { token: 'delimiter.bracket', foreground: '334155' },
        { token: 'delimiter.parenthesis', foreground: '334155' },
        { token: 'delimiter.square', foreground: '334155' },
        { token: 'delimiter.angle', foreground: '334155' },
        { token: 'punctuation', foreground: '334155' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#334155', // slate-700 - default text color
        'editorLineNumber.foreground': '#CBD5E1', // slate-300 - lighter line numbers
        'editorLineNumber.activeForeground': '#64748B', // slate-500 - active line number
        'editor.lineHighlightBackground': '#F8FAFC', // slate-50
        'editorCursor.foreground': '#0891B2', // cyan-600
        'editor.selectionBackground': '#E0E7FF', // indigo-100 - selection
        'editor.inactiveSelectionBackground': '#EEF2FF', // indigo-50 - inactive selection
        'editorWhitespace.foreground': '#E2E8F0', // slate-200

        // Disable all word/symbol highlighting backgrounds
        'editor.wordHighlightBackground': '#00000000',
        'editor.wordHighlightStrongBackground': '#00000000',
        'editor.symbolHighlightBackground': '#00000000',
        'editor.findMatchBackground': '#00000000',
        'editor.findMatchHighlightBackground': '#00000000',
        'editor.findRangeHighlightBackground': '#00000000',

        // Bracket matching - disable colorization
        'editorBracketMatch.background': '#00000000', // transparent
        'editorBracketMatch.border': '#CBD5E1', // subtle border

        // Bracket pair colorization - disable
        'editorBracketHighlight.foreground1': '#334155',
        'editorBracketHighlight.foreground2': '#334155',
        'editorBracketHighlight.foreground3': '#334155',
        'editorBracketHighlight.foreground4': '#334155',
        'editorBracketHighlight.foreground5': '#334155',
        'editorBracketHighlight.foreground6': '#334155',
      },
    });

    // Dark theme - Neon Cyberpunk
    monaco.editor.defineTheme('codescribe-dark', {
      base: 'vs-dark',
      inherit: false,
      rules: [
        // Default - slate-200
        { token: '', foreground: 'E2E8F0' },

        // Comments - slate-500 (muted)
        { token: 'comment', foreground: '64748B', fontStyle: 'italic' },

        // Keywords - purple-400 (import, export, class, async, return, const, etc.)
        { token: 'keyword', foreground: 'C084FC' },

        // Strings - green-400
        { token: 'string', foreground: '4ADE80' },

        // Numbers - cyan-400
        { token: 'number', foreground: '22D3EE' },

        // Punctuation - slate-200 (all brackets, braces, parentheses, etc.)
        { token: 'delimiter', foreground: 'E2E8F0' },
        { token: 'delimiter.curly', foreground: 'E2E8F0' },
        { token: 'delimiter.bracket', foreground: 'E2E8F0' },
        { token: 'delimiter.parenthesis', foreground: 'E2E8F0' },
        { token: 'delimiter.square', foreground: 'E2E8F0' },
        { token: 'delimiter.angle', foreground: 'E2E8F0' },
        { token: 'punctuation', foreground: 'E2E8F0' },
      ],
      colors: {
        'editor.background': '#0F172A', // slate-900
        'editor.foreground': '#E2E8F0', // slate-200 - default text color
        'editorLineNumber.foreground': '#475569', // slate-600 - line numbers
        'editorLineNumber.activeForeground': '#94A3B8', // slate-400 - active line number
        'editor.lineHighlightBackground': '#334155', // slate-700 - current line highlight
        'editorCursor.foreground': '#22D3EE', // cyan-400 - cursor
        'editor.selectionBackground': '#6366F180', // indigo-500 with 50% opacity
        'editor.inactiveSelectionBackground': '#6366F140', // indigo-500 with 25% opacity
        'editorWhitespace.foreground': '#334155', // slate-700

        // Disable all word/symbol highlighting backgrounds
        'editor.wordHighlightBackground': '#00000000',
        'editor.wordHighlightStrongBackground': '#00000000',
        'editor.symbolHighlightBackground': '#00000000',
        'editor.findMatchBackground': '#00000000',
        'editor.findMatchHighlightBackground': '#00000000',
        'editor.findRangeHighlightBackground': '#00000000',

        // Bracket matching - subtle
        'editorBracketMatch.background': '#00000000', // transparent
        'editorBracketMatch.border': '#64748B', // slate-500 - subtle border

        // Bracket pair colorization - disable (use same color)
        'editorBracketHighlight.foreground1': '#E2E8F0',
        'editorBracketHighlight.foreground2': '#E2E8F0',
        'editorBracketHighlight.foreground3': '#E2E8F0',
        'editorBracketHighlight.foreground4': '#E2E8F0',
        'editorBracketHighlight.foreground5': '#E2E8F0',
        'editorBracketHighlight.foreground6': '#E2E8F0',
      },
    });
  };

  return (
    <Editor
      height={height}
      language={language}
      value={value}
      onChange={onChange}
      options={options}
      theme={theme}
      beforeMount={handleEditorWillMount}
    />
  );
}
