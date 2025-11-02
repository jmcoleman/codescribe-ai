import { Editor } from '@monaco-editor/react';

/**
 * Monaco Editor wrapper component for lazy loading
 * This component is dynamically imported to reduce initial bundle size
 */
export function LazyMonacoEditor({ height, language, value, onChange, options, theme }) {
  // Define custom theme before mounting
  const handleEditorWillMount = (monaco) => {
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
