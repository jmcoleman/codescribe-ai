/**
 * Export Service
 * Handles exporting generated documentation in various formats
 *
 * Supported Formats:
 * - ZIP: Multiple documents bundled with manifest
 * - Markdown: Single document (already supported via frontend)
 *
 * Future:
 * - PDF: Generate PDF from markdown
 * - CSV: Export metadata for analytics
 */

import archiver from 'archiver';
import { PassThrough } from 'stream';

class ExportService {
  /**
   * Create a ZIP archive containing multiple documents
   * @param {Object[]} documents - Array of document objects
   * @param {Object} options - Export options
   * @returns {Promise<{stream: PassThrough, filename: string}>} ZIP stream and filename
   */
  async createDocumentsZip(documents, options = {}) {
    if (!Array.isArray(documents) || documents.length === 0) {
      throw new Error('documents must be a non-empty array');
    }

    const {
      batchId = null,
      summaryMarkdown = null,
      includeManifest = true
    } = options;

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = batchId
      ? `codescribe-batch-${timestamp}.zip`
      : `codescribe-export-${timestamp}.zip`;

    // Create a pass-through stream for the response
    const passThrough = new PassThrough();

    // Create archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Pipe archive to pass-through stream
    archive.pipe(passThrough);

    // Handle archive errors
    archive.on('error', (err) => {
      console.error('[ExportService] Archive error:', err);
      passThrough.destroy(err);
    });

    // Add documents to archive
    for (const doc of documents) {
      const docFilename = this._generateDocFilename(doc);
      archive.append(doc.documentation, { name: `docs/${docFilename}` });
    }

    // Add batch summary if provided
    if (summaryMarkdown) {
      archive.append(summaryMarkdown, { name: 'BATCH-SUMMARY.md' });
    }

    // Add manifest with metadata
    if (includeManifest) {
      const manifest = this._createManifest(documents, {
        batchId,
        hasSummary: !!summaryMarkdown
      });
      archive.append(JSON.stringify(manifest, null, 2), { name: 'MANIFEST.json' });
    }

    // Add README with export info
    const readme = this._createReadme(documents, { batchId, summaryMarkdown });
    archive.append(readme, { name: 'README.md' });

    // Finalize the archive (this triggers the actual compression)
    archive.finalize();

    return {
      stream: passThrough,
      filename,
      fileCount: documents.length
    };
  }

  /**
   * Create a ZIP archive for a specific batch
   * @param {Object} batchData - { batch, documents } from BatchService
   * @returns {Promise<{stream: PassThrough, filename: string}>}
   */
  async createBatchZip(batchData) {
    const { batch, documents } = batchData;

    if (!batch || !documents) {
      throw new Error('batchData must contain batch and documents');
    }

    return this.createDocumentsZip(documents, {
      batchId: batch.id,
      summaryMarkdown: batch.summary_markdown,
      includeManifest: true
    });
  }

  /**
   * Generate a safe filename for a document
   * @private
   */
  _generateDocFilename(doc) {
    // Get base filename without extension
    const baseName = doc.filename.replace(/\.[^/.]+$/, '');

    // Create safe filename
    const safeName = baseName
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);

    // Add doc type suffix for clarity
    const docTypeSuffix = doc.doc_type.toLowerCase();

    return `${safeName}.${docTypeSuffix}.md`;
  }

  /**
   * Create manifest JSON with export metadata
   * @private
   */
  _createManifest(documents, options = {}) {
    const { batchId, hasSummary } = options;

    return {
      exportedAt: new Date().toISOString(),
      exportedBy: 'CodeScribe AI',
      version: '1.0',
      batchId: batchId || null,
      hasSummary,
      totalFiles: documents.length,
      files: documents.map(doc => ({
        id: doc.id,
        originalFilename: doc.filename,
        exportedAs: `docs/${this._generateDocFilename(doc)}`,
        language: doc.language,
        docType: doc.doc_type,
        qualityScore: doc.quality_score,
        generatedAt: doc.generated_at,
        origin: doc.origin,
        github: doc.github_repo ? {
          repo: doc.github_repo,
          path: doc.github_path
        } : null
      }))
    };
  }

  /**
   * Create README for the export
   * @private
   */
  _createReadme(documents, options = {}) {
    const { batchId, summaryMarkdown } = options;
    const timestamp = new Date().toISOString();

    let readme = `# CodeScribe AI Export

**Exported:** ${timestamp}
**Files:** ${documents.length}
${batchId ? `**Batch ID:** ${batchId}` : ''}

## Contents

`;

    // List files
    readme += `### Documentation Files\n\n`;
    for (const doc of documents) {
      const exportedName = this._generateDocFilename(doc);
      const score = doc.quality_score?.score || 'N/A';
      const grade = doc.quality_score?.grade || 'N/A';
      readme += `- \`docs/${exportedName}\` - ${doc.filename} (${doc.doc_type}) - Score: ${score}/100 (${grade})\n`;
    }

    readme += `\n### Other Files\n\n`;
    readme += `- \`MANIFEST.json\` - Export metadata and file mappings\n`;
    if (summaryMarkdown) {
      readme += `- \`BATCH-SUMMARY.md\` - Generation summary from CodeScribe AI\n`;
    }

    readme += `
---

## About CodeScribe AI

This documentation was generated by [CodeScribe AI](https://codescribeai.com), an AI-powered code documentation generator.

### Quality Scores

Each document includes a quality score (0-100) based on:
- Overview & Description
- Installation Instructions
- Usage Examples
- API Documentation
- Code Structure

### Need Help?

- Website: https://codescribeai.com
- Support: support@codescribeai.com
`;

    return readme;
  }

  /**
   * Get estimated ZIP size (for UI progress)
   * @param {Object[]} documents - Array of documents
   * @returns {number} Estimated size in bytes
   */
  estimateZipSize(documents) {
    // Rough estimate: markdown compresses well, ~30% of original
    const totalMarkdownSize = documents.reduce((sum, doc) => {
      return sum + (doc.documentation?.length || 0);
    }, 0);

    // Add overhead for manifest, readme, and zip structure
    const overhead = 5000; // ~5KB for metadata files

    return Math.ceil(totalMarkdownSize * 0.3) + overhead;
  }
}

// Export singleton instance
export default new ExportService();
