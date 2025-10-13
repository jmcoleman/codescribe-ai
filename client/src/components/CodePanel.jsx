import { FileCode2, Zap } from 'lucide-react';
import { Editor } from '@monaco-editor/react';

export function CodePanel({
  code,
  onChange,
  filename = 'code.js',
  language = 'javascript',
  readOnly = false
}) {
  // Count lines and characters
  const lines = code.split('\n').length;
  const chars = code.length;

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        {/* Left: Traffic lights + filename */}
        <div className="flex items-center gap-3">
          {/* macOS-style traffic lights */}
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <span className="text-sm text-slate-600">{filename}</span>
        </div>

        {/* Right: Language badge */}
        <span className="text-xs text-slate-500 uppercase">{language}</span>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={onChange}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: 'JetBrains Mono, monospace',
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            readOnly,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
          }}
          theme="vs-light"
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-200">
        <span className="text-xs text-slate-500">
          {lines} lines • {chars} chars
        </span>
        <div className="flex items-center gap-1.5 text-xs">
          <Zap className="w-3 h-3 text-purple-500" />
          <span className="text-slate-600">Ready to analyze</span>
        </div>
      </div>
    </div>
  );
}