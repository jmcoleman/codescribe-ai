# API Examples

## Using cURL

\`\`\`bash
# Generate README
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"code":"function test() {}","docType":"README"}'

# Generate JSDoc comments
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"code":"function test() {}","docType":"JSDOC"}'

# Generate API documentation
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"code":"function test() {}","docType":"API"}'

# Generate Architecture documentation
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"code":"function test() {}","docType":"ARCHITECTURE"}'
\`\`\`

## Using JavaScript

\`\`\`javascript
// Generate README
const response = await fetch('http://localhost:3000/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'function test() {}',
    docType: 'README'
  })
});
const data = await response.json();

// Generate JSDoc comments
const jsdocResponse = await fetch('http://localhost:3000/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'function test() {}',
    docType: 'JSDOC'
  })
});

// Generate API documentation
const apiResponse = await fetch('http://localhost:3000/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'function test() {}',
    docType: 'API'
  })
});

// Generate Architecture documentation
const archResponse = await fetch('http://localhost:3000/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'function test() {}',
    docType: 'ARCHITECTURE'
  })
});
\`\`\`

## Using Postman

See [CodeScribe-AI.postman_collection.json](./CodeScribe-AI.postman_collection.json)