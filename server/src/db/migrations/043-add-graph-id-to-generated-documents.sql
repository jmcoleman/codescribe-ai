-- Migration: 043-add-graph-id-to-generated-documents.sql
-- Description: Add graph_id column to track which graph instance was used for generation
-- Part of: Graph Visibility & History Integration (Epic 5.4)
--
-- This links each generated document to the specific project graph instance that
-- provided cross-file context during documentation generation. The graph_id is a
-- 32-char SHA256 hash that uniquely identifies the graph analysis run.
--
-- Enables:
-- - Showing which graph instance was used in History view
-- - "Regenerate with same context" feature
-- - Auditing/debugging which files influenced output

-- Add graph_id column to generated_documents
-- References project_graphs(graph_id) which is the unique 32-char hash for each graph instance
ALTER TABLE generated_documents
ADD COLUMN IF NOT EXISTS graph_id VARCHAR(32) REFERENCES project_graphs(graph_id) ON DELETE SET NULL;

-- Index for querying documents by graph
CREATE INDEX IF NOT EXISTS idx_generated_docs_graph_id
  ON generated_documents(graph_id)
  WHERE graph_id IS NOT NULL AND deleted_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN generated_documents.graph_id IS 'Reference to project_graphs.graph_id - the unique 32-char hash identifying the graph instance that provided cross-file context';

-- Verify migration
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'generated_documents'
  AND column_name = 'graph_id';

SELECT indexname
FROM pg_indexes
WHERE tablename = 'generated_documents'
  AND indexname = 'idx_generated_docs_graph_id';
