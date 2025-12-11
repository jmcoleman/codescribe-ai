import { Suspense, lazy } from 'react';

// Lazy-loaded modal components
const QualityScoreModal = lazy(() => import('./QualityScore').then(m => ({ default: m.QualityScoreModal })));
const SamplesModal = lazy(() => import('./SamplesModal').then(m => ({ default: m.SamplesModal })));
const HelpModal = lazy(() => import('./HelpModal').then(m => ({ default: m.HelpModal })));
const ConfirmationModal = lazy(() => import('./ConfirmationModal').then(m => ({ default: m.ConfirmationModal })));
const UsageLimitModal = lazy(() => import('./UsageLimitModal').then(m => ({ default: m.UsageLimitModal })));
const TermsAcceptanceModal = lazy(() => import('./TermsAcceptanceModal'));
const ContactSupportModal = lazy(() => import('./ContactSupportModal').then(m => ({ default: m.ContactSupportModal })));
const GitHubLoadModal = lazy(() => import('./GitHubLoader').then(m => ({ default: m.GitHubLoadModal })));
const UnsupportedFileModal = lazy(() => import('./UnsupportedFileModal').then(m => ({ default: m.UnsupportedFileModal })));

/**
 * Modal loading fallback
 */
function ModalLoadingFallback() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6">
        <div className="animate-pulse text-slate-600 dark:text-slate-300">Loading...</div>
      </div>
    </div>
  );
}

/**
 * AppModals Component
 *
 * Consolidates all modal rendering for the App component.
 * Modals are lazy-loaded and wrapped in Suspense for code splitting.
 *
 * @param {Object} props - All modal-related state and handlers from App
 */
export function AppModals({
  // Quality Score Modal
  showQualityModal,
  qualityScore,
  onCloseQualityModal,
  filename,

  // Samples Modal
  showSamplesModal,
  onCloseSamplesModal,
  onLoadSample,
  currentCode,
  samplesButtonRef,

  // Help Modal
  showHelpModal,
  onCloseHelpModal,

  // Large Code Confirmation Modal
  showConfirmationModal,
  largeCodeStats,
  onCloseConfirmationModal,
  onConfirmLargeCode,

  // Generate From Editor Modal
  showGenerateFromEditorModal,
  onCloseGenerateFromEditorModal,
  onConfirmGenerateFromEditor,

  // Regenerate Modal
  showRegenerateModal,
  regenerateModalData,
  onRegenerateAll,
  onGenerateNewOnly,
  onCancelRegenerate,

  // Usage Limit Modal
  showUsageLimitModal,
  onCloseUsageLimitModal,
  usage,
  onUpgrade,

  // Terms Modal
  showTermsModal,
  onAcceptTerms,
  legalStatus,

  // Contact Support Modal
  showSupportModal,
  onCloseSupportModal,
  onShowLoginFromSupport,

  // GitHub Modal
  showGithubModal,
  onCloseGithubModal,
  onGithubFileLoad,
  onGithubFilesLoad,
  onGithubImportErrors,
  defaultDocType,

  // Unsupported File Modal
  unsupportedFileModal,
  onCloseUnsupportedFileModal,

  // Reload From Source Modal
  showReloadFromSourceModal,
  filesToReloadFromSource,
  reloadFromSourceProgress,
  onCloseReloadFromSourceModal,
  onConfirmReloadFromSource,
  onGenerateAfterReload
}) {
  return (
    <>
      {/* Quality Score Modal */}
      {showQualityModal && qualityScore && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <QualityScoreModal
            qualityScore={qualityScore}
            onClose={onCloseQualityModal}
            filename={filename}
          />
        </Suspense>
      )}

      {/* Samples Modal */}
      {showSamplesModal && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <SamplesModal
            isOpen={showSamplesModal}
            onClose={() => {
              onCloseSamplesModal();
              // Return focus to Samples button after modal closes
              setTimeout(() => {
                samplesButtonRef.current?.focus();
              }, 0);
            }}
            onLoadSample={onLoadSample}
            currentCode={currentCode}
          />
        </Suspense>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <HelpModal
            isOpen={showHelpModal}
            onClose={onCloseHelpModal}
          />
        </Suspense>
      )}

      {/* Confirmation Modal for Large Code Submissions */}
      {showConfirmationModal && largeCodeStats && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <ConfirmationModal
            isOpen={showConfirmationModal}
            onClose={onCloseConfirmationModal}
            onConfirm={onConfirmLargeCode}
            title="Large File Submission"
            variant="warning"
            confirmLabel="Generate Anyway"
            cancelLabel="Cancel"
            message={
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  You're about to generate documentation for a <strong className="font-semibold text-slate-900 dark:text-white">large code file</strong>. This may take longer and consume more API resources.
                </p>

                {/* Visual separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

                {/* Stats box with purple accent */}
                <div className="bg-white dark:bg-slate-800 border-l-4 border-purple-500 dark:border-purple-400 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Lines of code</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-purple-900 dark:text-purple-300">{largeCodeStats.lines.toLocaleString()}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">lines</span>
                    </div>
                  </div>
                  <div className="h-px bg-slate-100 dark:bg-slate-700" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">File size</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-indigo-900 dark:text-indigo-300">{largeCodeStats.sizeInKB}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">KB</span>
                    </div>
                  </div>
                  <div className="h-px bg-slate-100 dark:bg-slate-700" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Characters</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-purple-900 dark:text-purple-300">{largeCodeStats.charCount.toLocaleString()}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">chars</span>
                    </div>
                  </div>
                </div>

                {/* Tip box */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">💡 Tip:</span> Breaking your code into smaller modules improves documentation quality and generation speed.
                  </p>
                </div>
              </div>
            }
          />
        </Suspense>
      )}

      {/* Confirmation Modal for Generating from Code Editor */}
      {showGenerateFromEditorModal && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <ConfirmationModal
            isOpen={showGenerateFromEditorModal}
            onClose={onCloseGenerateFromEditorModal}
            onConfirm={onConfirmGenerateFromEditor}
            title="No Files Selected"
            variant="info"
            confirmLabel="Generate from Editor"
            cancelLabel="Cancel"
            message={
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                No files are currently selected in your workspace. Would you like to generate documentation for the code in your editor instead?
              </p>
            }
          />
        </Suspense>
      )}

      {/* Confirmation Modal for Regenerating Files with Existing Documentation */}
      {showRegenerateModal && regenerateModalData && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <ConfirmationModal
            isOpen={showRegenerateModal}
            onClose={regenerateModalData?.allHaveDocs ? onCancelRegenerate : onGenerateNewOnly}
            onConfirm={onRegenerateAll}
            title="Existing Documentation Found"
            variant="info"
            confirmLabel={regenerateModalData?.allHaveDocs ? 'Regenerate' : 'Regenerate All'}
            cancelLabel={regenerateModalData?.allHaveDocs ? 'Cancel' : 'New Files Only'}
            message={
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {regenerateModalData?.allHaveDocs ? (
                    <>
                      {regenerateModalData.totalFiles === 1 ? (
                        <>The selected file already has documentation.</>
                      ) : (
                        <>All <span className="font-semibold">{regenerateModalData.totalFiles}</span> selected files already have documentation.</>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">{regenerateModalData.filesWithDocs}</span> of{' '}
                      <span className="font-semibold">{regenerateModalData.totalFiles}</span> selected files already have documentation.
                    </>
                  )}
                </p>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {regenerateModalData?.allHaveDocs ? (
                    <>Would you like to regenerate the documentation?</>
                  ) : (
                    <>Would you like to regenerate documentation for all files, or only generate for new files?</>
                  )}
                </p>
              </div>
            }
          />
        </Suspense>
      )}

      {/* Usage Limit Modal (100% limit reached) */}
      {showUsageLimitModal && usage && (
        <UsageLimitModal
          isOpen={showUsageLimitModal}
          onClose={onCloseUsageLimitModal}
          usage={usage}
          currentTier={usage.tier}
          onUpgrade={onUpgrade}
        />
      )}

      {/* Terms Acceptance Modal - Non-dismissible when terms need acceptance */}
      {showTermsModal && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <TermsAcceptanceModal
            isOpen={showTermsModal}
            onAccept={onAcceptTerms}
            missingAcceptance={legalStatus?.details}
            currentVersions={{
              terms: legalStatus?.details?.terms?.current_version,
              privacy: legalStatus?.details?.privacy?.current_version,
            }}
          />
        </Suspense>
      )}

      {/* Contact Support Modal */}
      {showSupportModal && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <ContactSupportModal
            isOpen={showSupportModal}
            onClose={onCloseSupportModal}
            onShowLogin={onShowLoginFromSupport}
          />
        </Suspense>
      )}

      {/* GitHub Load Modal */}
      {showGithubModal && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <GitHubLoadModal
            isOpen={showGithubModal}
            onClose={onCloseGithubModal}
            onFileLoad={onGithubFileLoad}
            onFilesLoad={onGithubFilesLoad}
            onImportErrors={onGithubImportErrors}
            defaultDocType={defaultDocType}
          />
        </Suspense>
      )}

      {/* Unsupported File Type Modal */}
      {unsupportedFileModal.isOpen && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <UnsupportedFileModal
            isOpen={unsupportedFileModal.isOpen}
            onClose={onCloseUnsupportedFileModal}
            fileName={unsupportedFileModal.fileName}
            fileExtension={unsupportedFileModal.fileExtension}
          />
        </Suspense>
      )}

      {/* Reload From Source Modal */}
      {showReloadFromSourceModal && (
        <Suspense fallback={<ModalLoadingFallback />}>
          {(() => {
            const isLoading = reloadFromSourceProgress && reloadFromSourceProgress.completed < reloadFromSourceProgress.total;
            const isComplete = reloadFromSourceProgress && reloadFromSourceProgress.completed === reloadFromSourceProgress.total;
            const successCount = reloadFromSourceProgress?.successIds?.length || 0;
            const failCount = isComplete ? (reloadFromSourceProgress.total - successCount) : 0;

            return (
              <ConfirmationModal
                isOpen={showReloadFromSourceModal}
                onClose={isLoading ? undefined : onCloseReloadFromSourceModal}
                onConfirm={isLoading ? undefined : (isComplete ? onGenerateAfterReload : onConfirmReloadFromSource)}
                closeOnConfirm={false}
                title={isComplete ? 'Ready to Generate' : 'Code Content Required'}
                variant="info"
                confirmLabel={
                  isLoading
                    ? `Loading ${reloadFromSourceProgress.completed}/${reloadFromSourceProgress.total}...`
                    : isComplete
                    ? `Generate ${successCount} File${successCount !== 1 ? 's' : ''}`
                    : filesToReloadFromSource?.length > 0
                    ? 'Reload from Source'
                    : 'OK'
                }
                cancelLabel={isComplete ? 'Close' : 'Cancel'}
                message={
                  <div className="space-y-3">
                    {isComplete ? (
                      <>
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                          {successCount > 0 ? (
                            <>
                              Successfully reloaded <span className="font-semibold">{successCount}</span> file{successCount !== 1 ? 's' : ''} from GitHub.
                              {failCount > 0 && (
                                <span className="text-amber-600 dark:text-amber-400"> ({failCount} failed)</span>
                              )}
                            </>
                          ) : (
                            <span className="text-red-600 dark:text-red-400">
                              Failed to reload files. Please try again or re-upload the files.
                            </span>
                          )}
                        </p>
                        {successCount > 0 && (
                          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                            Click <span className="font-semibold">Generate</span> to create documentation.
                          </p>
                        )}
                      </>
                    ) : isLoading ? (
                      <>
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                          Reloading files from GitHub...
                        </p>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(reloadFromSourceProgress.completed / reloadFromSourceProgress.total) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                          {reloadFromSourceProgress.completed} of {reloadFromSourceProgress.total} files
                        </p>
                      </>
                    ) : filesToReloadFromSource?.length > 0 ? (
                      <>
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                          The selected files have no code content. They were loaded from history without the original source code.
                        </p>
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                          <span className="font-semibold">{filesToReloadFromSource.length}</span> {filesToReloadFromSource.length === 1 ? 'file can' : 'files can'} be reloaded from GitHub:
                        </p>
                        <ul className="text-sm text-slate-600 dark:text-slate-400 list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
                          {filesToReloadFromSource.slice(0, 10).map((file, i) => (
                            <li key={file.id || i} className="truncate">
                              {file.filename}
                            </li>
                          ))}
                          {filesToReloadFromSource.length > 10 && (
                            <li className="text-slate-500">...and {filesToReloadFromSource.length - 10} more</li>
                          )}
                        </ul>
                      </>
                    ) : (
                      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        The selected files have no code content and cannot be reloaded from their original source. Please re-upload the files to generate documentation.
                      </p>
                    )}
                  </div>
                }
              />
            );
          })()}
        </Suspense>
      )}
    </>
  );
}
