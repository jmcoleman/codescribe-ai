import { X, Code2, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { codeExamples } from '../data/examples';

export function ExamplesModal({ isOpen, onClose, onLoadExample }) {
  const [selectedExample, setSelectedExample] = useState(null);

  if (!isOpen) return null;

  const handleLoadExample = (example) => {
    onLoadExample(example);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-slate-900">Code Examples</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
            aria-label="Close examples modal"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 h-[calc(90vh-120px)]">
          {/* Left: Example List */}
          <div className="border-r border-slate-200 overflow-y-auto">
            <div className="p-4">
              <p className="text-sm text-slate-600 mb-4">
                Click a card to preview • Click <ChevronRight className="w-3.5 h-3.5 inline mx-0.5 -mt-0.5" /> to load
              </p>
              <div className="space-y-2">
                {codeExamples.map((example) => (
                  <ExampleCard
                    key={example.id}
                    example={example}
                    isSelected={selectedExample?.id === example.id}
                    onPreview={() => setSelectedExample(example)}
                    onLoad={() => handleLoadExample(example)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="overflow-y-auto bg-slate-50">
            {selectedExample ? (
              <ExamplePreview example={selectedExample} onLoad={() => handleLoadExample(selectedExample)} />
            ) : (
              <div className="flex items-center justify-center h-full p-6 text-center">
                <div>
                  <Code2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">
                    Select an example to preview
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExampleCard({ example, isSelected, onPreview, onLoad }) {
  return (
    <div
      className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
        isSelected
          ? 'border-purple-500 bg-purple-50'
          : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/50'
      }`}
      onClick={onPreview}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            {example.title}
          </h3>
          <p className="text-xs text-slate-600 line-clamp-2">
            {example.description}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded font-medium">
              {example.docType}
            </span>
            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-medium">
              {example.language}
            </span>
          </div>
        </div>

        {/* Load Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLoad();
          }}
          className="flex-shrink-0 p-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          aria-label={`Load ${example.title} example`}
          title="Load into editor"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function ExamplePreview({ example, onLoad }) {
  return (
    <div className="flex flex-col h-full">
      {/* Action Button */}
      <div className="p-4 border-b border-slate-200">
        <button
          onClick={onLoad}
          className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm shadow-sm"
        >
          Load This Example
        </button>
      </div>

      {/* Code Preview */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <pre className="text-xs font-mono text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
            <code>{example.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
