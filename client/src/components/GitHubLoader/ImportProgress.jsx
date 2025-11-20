/**
 * Import Progress Component
 * Shows real-time progress during batch file import from GitHub
 */

import { Loader2, CheckCircle, XCircle, FileCode } from 'lucide-react';

export function ImportProgress({
  total,
  completed,
  failed,
  currentFile,
  isComplete
}) {
  const successful = completed - failed;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-[90vw] max-w-md p-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
            {isComplete ? (
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            ) : (
              <Loader2 className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin" />
            )}
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {isComplete ? 'Import Complete' : 'Importing Files'}
          </h2>

          <p className="text-sm text-slate-600 dark:text-slate-400">
            {isComplete ? (
              <>
                {successful} successful, {failed} failed
              </>
            ) : (
              <>
                {completed} of {total} files imported
              </>
            )}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-500 dark:to-indigo-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{Math.round(progress)}%</span>
            <span>{completed}/{total}</span>
          </div>
        </div>

        {/* Current File */}
        {!isComplete && currentFile && (
          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg mb-4">
            <FileCode className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
            <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
              {currentFile}
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {total}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Total
            </div>
          </div>

          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-lg font-bold text-green-700 dark:text-green-400 flex items-center justify-center gap-1">
              <CheckCircle className="w-4 h-4" />
              {successful}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              Success
            </div>
          </div>

          {failed > 0 && (
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-lg font-bold text-red-700 dark:text-red-400 flex items-center justify-center gap-1">
                <XCircle className="w-4 h-4" />
                {failed}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400">
                Failed
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
