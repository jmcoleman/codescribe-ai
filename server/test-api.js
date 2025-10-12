const API_URL = 'http://localhost:3000/api';

async function testGenerate() {
  const response = await fetch(`${API_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: 'function test() { return true; }',
      docType: 'README'
    })
  });

  const data = await response.json();
  console.log('Documentation:', data.documentation);
  console.log('Quality Score:', data.qualityScore.score);
}

testGenerate();