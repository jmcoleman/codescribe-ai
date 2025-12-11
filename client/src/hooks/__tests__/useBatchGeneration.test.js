/**
 * Tests for useBatchGeneration Hook
 *
 * Tests batch generation functionality including:
 * - Batch summary document generation
 * - Tier-based attribution
 * - Cancellation and skipped files tracking
 * - Status message generation
 */

import { describe, it, expect } from 'vitest';
import { generateBatchSummaryDocument, buildAttribution } from '../useBatchGeneration';

describe('useBatchGeneration', () => {
  describe('buildAttribution', () => {
    it('should return free tier attribution with upgrade CTA', () => {
      const result = buildAttribution('free');
      expect(result).toContain('Free Tier');
      expect(result).toContain('Upgrade to');
      expect(result).toContain('Pro');
    });

    it('should return starter tier attribution with upgrade CTA', () => {
      const result = buildAttribution('starter');
      expect(result).toContain('Starter');
      expect(result).toContain('Upgrade to');
    });

    it('should return pro tier attribution without upgrade CTA', () => {
      const result = buildAttribution('pro');
      expect(result).toContain('CodeScribe AI');
      expect(result).not.toContain('Upgrade');
    });

    it('should return premium tier attribution without upgrade CTA', () => {
      const result = buildAttribution('premium');
      expect(result).toContain('CodeScribe AI');
      expect(result).not.toContain('Upgrade');
    });

    it('should return team tier attribution (minimal)', () => {
      const result = buildAttribution('team');
      expect(result).toContain('CodeScribe AI');
      expect(result).not.toContain('Upgrade');
    });

    it('should return empty string for enterprise tier', () => {
      const result = buildAttribution('enterprise');
      expect(result).toBe('');
    });

    it('should default to free tier for unknown tier', () => {
      const result = buildAttribution('unknown');
      expect(result).toContain('Free Tier');
    });
  });

  describe('generateBatchSummaryDocument', () => {
    describe('Basic Summary Generation', () => {
      it('should generate summary with title', () => {
        const summary = {
          totalFiles: 3,
          successCount: 3,
          failCount: 0,
          avgQuality: 85,
          avgGrade: 'B',
          successfulFiles: []
        };

        const result = generateBatchSummaryDocument(summary, [], 'pro');
        expect(result).toContain('# Batch Documentation Summary');
      });

      it('should include generated timestamp', () => {
        const summary = {
          totalFiles: 2,
          successCount: 2,
          failCount: 0,
          avgQuality: 90,
          avgGrade: 'A',
          successfulFiles: []
        };

        const result = generateBatchSummaryDocument(summary, [], 'pro');
        expect(result).toContain('**Generated**');
      });

      it('should show success status when all files complete', () => {
        const summary = {
          totalFiles: 3,
          successCount: 3,
          failCount: 0,
          avgQuality: 85,
          avgGrade: 'B',
          successfulFiles: []
        };

        const result = generateBatchSummaryDocument(summary, [], 'pro');
        expect(result).toContain('✅ All files completed successfully');
      });

      it('should show warning status when some files fail', () => {
        const summary = {
          totalFiles: 5,
          successCount: 3,
          failCount: 2,
          avgQuality: 80,
          avgGrade: 'B',
          successfulFiles: []
        };

        const result = generateBatchSummaryDocument(summary, [], 'pro');
        expect(result).toContain('⚠️ 2 files failed');
      });

      it('should show singular "file" when only one fails', () => {
        const summary = {
          totalFiles: 3,
          successCount: 2,
          failCount: 1,
          avgQuality: 85,
          avgGrade: 'B',
          successfulFiles: []
        };

        const result = generateBatchSummaryDocument(summary, [], 'pro');
        expect(result).toContain('⚠️ 1 file failed');
      });
    });

    describe('Statistics Table', () => {
      it('should include overall statistics section', () => {
        const summary = {
          totalFiles: 5,
          successCount: 4,
          failCount: 1,
          avgQuality: 82,
          avgGrade: 'B',
          successfulFiles: []
        };

        const result = generateBatchSummaryDocument(summary, [], 'pro');
        expect(result).toContain('## Overall Statistics');
        expect(result).toContain('Total Files');
        expect(result).toContain('Successful');
        expect(result).toContain('Failed');
        expect(result).toContain('Avg Quality');
      });

      it('should show correct statistics values', () => {
        const summary = {
          totalFiles: 10,
          successCount: 8,
          failCount: 2,
          avgQuality: 78,
          avgGrade: 'C',
          successfulFiles: []
        };

        const result = generateBatchSummaryDocument(summary, [], 'pro');
        expect(result).toContain('| 10 |');
        expect(result).toContain('| 8 |');
        expect(result).toContain('| 2 |');
        expect(result).toContain('78/100 (C)');
      });

      it('should include Skipped column when there are skipped files', () => {
        const summary = {
          totalFiles: 5,
          successCount: 2,
          failCount: 0,
          skippedCount: 3,
          avgQuality: 85,
          avgGrade: 'B',
          successfulFiles: [],
          skippedFiles: [
            { filename: 'file3.js', docType: 'README' },
            { filename: 'file4.js', docType: 'JSDOC' },
            { filename: 'file5.js', docType: 'API' }
          ],
          wasCancelled: true
        };

        const result = generateBatchSummaryDocument(summary, [], 'pro');
        expect(result).toContain('Skipped');
        expect(result).toContain('| 3 |');
      });

      it('should not include Skipped column when no files are skipped', () => {
        const summary = {
          totalFiles: 3,
          successCount: 3,
          failCount: 0,
          skippedCount: 0,
          avgQuality: 90,
          avgGrade: 'A',
          successfulFiles: []
        };

        const result = generateBatchSummaryDocument(summary, [], 'pro');
        // Check that the header row doesn't contain "Skipped"
        const lines = result.split('\n');
        const headerLine = lines.find(line => line.includes('Total Files') && line.includes('Successful'));
        expect(headerLine).not.toContain('Skipped');
      });
    });

    describe('Generated Files Section', () => {
      it('should list successful files with details', () => {
        const summary = {
          totalFiles: 2,
          successCount: 2,
          failCount: 0,
          avgQuality: 88,
          avgGrade: 'B',
          successfulFiles: [
            { name: 'utils.js', docType: 'README', score: 90, grade: 'A' },
            { name: 'api.js', docType: 'API', score: 85, grade: 'B' }
          ]
        };

        const result = generateBatchSummaryDocument(summary, [], 'pro');
        expect(result).toContain('## Generated Files');
        expect(result).toContain('utils.js');
        expect(result).toContain('api.js');
        expect(result).toContain('90/100');
        expect(result).toContain('85/100');
      });

      it('should include file links and export actions', () => {
        const summary = {
          totalFiles: 1,
          successCount: 1,
          failCount: 0,
          avgQuality: 95,
          avgGrade: 'A',
          successfulFiles: [
            { name: 'component.jsx', docType: 'JSDOC', score: 95, grade: 'A', documentId: 'doc-123' }
          ]
        };

        const result = generateBatchSummaryDocument(summary, [], 'pro');
        // File links use documentId for specific version linking
        expect(result).toContain('[component.jsx](#doc:doc-123)');
        expect(result).toContain('[Export]');
      });

      it('should render filename as plain text when no documentId', () => {
        const summary = {
          totalFiles: 1,
          successCount: 1,
          failCount: 0,
          avgQuality: 95,
          avgGrade: 'A',
          successfulFiles: [
            { name: 'component.jsx', docType: 'JSDOC', score: 95, grade: 'A' }
            // No documentId - shouldn't happen in practice but graceful fallback
          ]
        };

        const result = generateBatchSummaryDocument(summary, [], 'pro');
        // Without documentId, filename is plain text (not a link)
        expect(result).toContain('| component.jsx |');
        expect(result).not.toContain('#doc:');
        expect(result).toContain('[Export]');
      });

      it('should not show Generated Files section when no files succeeded', () => {
        const summary = {
          totalFiles: 2,
          successCount: 0,
          failCount: 2,
          avgQuality: 0,
          avgGrade: null,
          successfulFiles: []
        };

        const result = generateBatchSummaryDocument(summary, [], 'pro');
        expect(result).not.toContain('## Generated Files');
      });
    });

    describe('Failed Files Section', () => {
      it('should list failed files with errors', () => {
        const summary = {
          totalFiles: 3,
          successCount: 1,
          failCount: 2,
          avgQuality: 85,
          avgGrade: 'B',
          successfulFiles: []
        };

        const failedFiles = [
          { filename: 'broken.js', error: 'API rate limit exceeded' },
          { filename: 'invalid.ts', error: 'Parsing error' }
        ];

        const result = generateBatchSummaryDocument(summary, failedFiles, 'pro');
        expect(result).toContain('## Failed Files');
        expect(result).toContain('broken.js');
        expect(result).toContain('invalid.ts');
        expect(result).toContain('API rate limit exceeded');
        expect(result).toContain('Parsing error');
      });

      it('should escape pipe characters in error messages', () => {
        const summary = {
          totalFiles: 1,
          successCount: 0,
          failCount: 1,
          avgQuality: 0,
          avgGrade: null,
          successfulFiles: []
        };

        const failedFiles = [
          { filename: 'test.js', error: 'Error | with | pipes' }
        ];

        const result = generateBatchSummaryDocument(summary, failedFiles, 'pro');
        expect(result).toContain('Error \\| with \\| pipes');
      });

      it('should not show Failed Files section when no files failed', () => {
        const summary = {
          totalFiles: 2,
          successCount: 2,
          failCount: 0,
          avgQuality: 90,
          avgGrade: 'A',
          successfulFiles: []
        };

        const result = generateBatchSummaryDocument(summary, [], 'pro');
        expect(result).not.toContain('## Failed Files');
      });
    });

    describe('Skipped Files Section (Cancellation)', () => {
      it('should list skipped files when batch was cancelled', () => {
        const summary = {
          totalFiles: 5,
          successCount: 2,
          failCount: 0,
          skippedCount: 3,
          avgQuality: 85,
          avgGrade: 'B',
          successfulFiles: [],
          skippedFiles: [
            { filename: 'file3.js', docType: 'README' },
            { filename: 'file4.js', docType: 'JSDOC' },
            { filename: 'file5.js', docType: 'API' }
          ],
          wasCancelled: true
        };

        const result = generateBatchSummaryDocument(summary, [], 'pro');
        expect(result).toContain('## Skipped Files');
        expect(result).toContain('file3.js');
        expect(result).toContain('file4.js');
        expect(result).toContain('file5.js');
        expect(result).toContain('batch cancellation');
      });

      it('should show doc type for each skipped file', () => {
        const summary = {
          totalFiles: 3,
          successCount: 1,
          failCount: 0,
          skippedCount: 2,
          avgQuality: 90,
          avgGrade: 'A',
          successfulFiles: [],
          skippedFiles: [
            { filename: 'api.js', docType: 'API' },
            { filename: 'arch.js', docType: 'ARCHITECTURE' }
          ],
          wasCancelled: true
        };

        const result = generateBatchSummaryDocument(summary, [], 'pro');
        expect(result).toContain('| api.js | API |');
        expect(result).toContain('| arch.js | ARCHITECTURE |');
      });

      it('should not show Skipped Files section when no files were skipped', () => {
        const summary = {
          totalFiles: 3,
          successCount: 3,
          failCount: 0,
          skippedCount: 0,
          avgQuality: 88,
          avgGrade: 'B',
          successfulFiles: [],
          skippedFiles: []
        };

        const result = generateBatchSummaryDocument(summary, [], 'pro');
        expect(result).not.toContain('## Skipped Files');
      });
    });

    describe('Cancelled Batch Status', () => {
      it('should show cancelled status when wasCancelled is true', () => {
        const summary = {
          totalFiles: 5,
          successCount: 2,
          failCount: 0,
          skippedCount: 3,
          avgQuality: 85,
          avgGrade: 'B',
          successfulFiles: [],
          skippedFiles: [],
          wasCancelled: true
        };

        const result = generateBatchSummaryDocument(summary, [], 'pro');
        expect(result).toContain('⚠️ Cancelled');
        expect(result).toContain('2 of 5 files completed');
      });

      it('should not show cancelled status when wasCancelled is false', () => {
        const summary = {
          totalFiles: 3,
          successCount: 3,
          failCount: 0,
          avgQuality: 90,
          avgGrade: 'A',
          successfulFiles: [],
          wasCancelled: false
        };

        const result = generateBatchSummaryDocument(summary, [], 'pro');
        expect(result).not.toContain('Cancelled');
        expect(result).toContain('✅ All files completed successfully');
      });

      it('should handle cancelled batch with zero completed files', () => {
        const summary = {
          totalFiles: 3,
          successCount: 0,
          failCount: 0,
          skippedCount: 3,
          avgQuality: 0,
          avgGrade: null,
          successfulFiles: [],
          skippedFiles: [
            { filename: 'file1.js', docType: 'README' },
            { filename: 'file2.js', docType: 'README' },
            { filename: 'file3.js', docType: 'README' }
          ],
          wasCancelled: true
        };

        const result = generateBatchSummaryDocument(summary, [], 'pro');
        expect(result).toContain('⚠️ Cancelled');
        expect(result).toContain('0 of 3 files completed');
      });
    });

    describe('Quality Assessment Section', () => {
      it('should include quality breakdown when available', () => {
        const summary = {
          totalFiles: 1,
          successCount: 1,
          failCount: 0,
          avgQuality: 85,
          avgGrade: 'B',
          successfulFiles: [
            {
              name: 'test.js',
              docType: 'README',
              score: 85,
              grade: 'B',
              qualityScore: {
                breakdown: {
                  overview: { status: 'complete' },
                  installation: { status: 'partial' },
                  examples: { status: 'complete' },
                  apiDocs: { status: 'missing' },
                  structure: { status: 'complete' }
                }
              }
            }
          ]
        };

        const result = generateBatchSummaryDocument(summary, [], 'pro');
        expect(result).toContain('## Quality Assessment');
        expect(result).toContain('Legend');
      });

      it('should show check marks for complete criteria', () => {
        const summary = {
          totalFiles: 1,
          successCount: 1,
          failCount: 0,
          avgQuality: 100,
          avgGrade: 'A',
          successfulFiles: [
            {
              name: 'perfect.js',
              docType: 'README',
              score: 100,
              grade: 'A',
              qualityScore: {
                breakdown: {
                  overview: { status: 'complete' },
                  installation: { status: 'complete' },
                  examples: { status: 'complete' },
                  apiDocs: { status: 'complete' },
                  structure: { status: 'complete' }
                }
              }
            }
          ]
        };

        const result = generateBatchSummaryDocument(summary, [], 'pro');
        expect(result).toContain('✓');
      });
    });

    describe('Tier Attribution', () => {
      it('should include tier attribution at the end', () => {
        const summary = {
          totalFiles: 1,
          successCount: 1,
          failCount: 0,
          avgQuality: 85,
          avgGrade: 'B',
          successfulFiles: []
        };

        const result = generateBatchSummaryDocument(summary, [], 'free');
        expect(result).toContain('Free Tier');
      });

      it('should not include attribution for enterprise tier', () => {
        const summary = {
          totalFiles: 1,
          successCount: 1,
          failCount: 0,
          avgQuality: 85,
          avgGrade: 'B',
          successfulFiles: []
        };

        const result = generateBatchSummaryDocument(summary, [], 'enterprise');
        // Enterprise has empty attribution, so it shouldn't have the attribution footer
        expect(result).not.toContain('Free Tier');
        expect(result).not.toContain('Starter');
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty summary gracefully', () => {
        const summary = {
          totalFiles: 0,
          successCount: 0,
          failCount: 0,
          avgQuality: 0,
          avgGrade: null,
          successfulFiles: []
        };

        const result = generateBatchSummaryDocument(summary, [], 'pro');
        expect(result).toContain('# Batch Documentation Summary');
        expect(result).toContain('0/100 (N/A)');
      });

      it('should handle missing optional fields', () => {
        const summary = {
          totalFiles: 2,
          successCount: 2,
          failCount: 0,
          avgQuality: 85,
          avgGrade: 'B'
          // successfulFiles, skippedFiles, wasCancelled intentionally omitted
        };

        // Should not throw
        const result = generateBatchSummaryDocument(summary, [], 'pro');
        expect(result).toContain('# Batch Documentation Summary');
      });

      it('should handle special characters in filenames', () => {
        const summary = {
          totalFiles: 1,
          successCount: 1,
          failCount: 0,
          avgQuality: 85,
          avgGrade: 'B',
          successfulFiles: [
            { name: 'file with spaces.js', docType: 'README', score: 85, grade: 'B' }
          ]
        };

        const result = generateBatchSummaryDocument(summary, [], 'pro');
        expect(result).toContain('file with spaces.js');
      });
    });
  });
});
