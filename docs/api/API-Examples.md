# API Examples

## Using cURL

\`\`\`bash
# Generate README
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"code":"function test() {}","docType":"README"}'
\`\`\`

## Using JavaScript

\`\`\`javascript
const response = await fetch('http://localhost:3000/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'function test() {}',
    docType: 'README'
  })
});
const data = await response.json();
\`\`\`

## Using Postman

See [CodeScribe-AI.postman_collection.json](./CodeScribe-AI.postman_collection.json)