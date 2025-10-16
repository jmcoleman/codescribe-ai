import { Editor } from '@monaco-editor/react';

/**
 * Monaco Editor wrapper component for lazy loading
 * This component is dynamically imported to reduce initial bundle size
 */
export function LazyMonacoEditor({ height, language, value, onChange, options, theme }) {
  return (
    <Editor
      height={height}
      language={language}
      value={value}
      onChange={onChange}
      options={options}
      theme={theme}
    />
  );
}
