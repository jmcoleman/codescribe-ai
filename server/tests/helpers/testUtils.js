/**
 * Common test utilities and helpers
 */

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a mock request object
 * @param {Object} options - Request options
 * @returns {Object} Mock request
 */
function mockRequest(options = {}) {
  return {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
    method: options.method || 'GET',
    url: options.url || '/',
  };
}

/**
 * Create a mock response object
 * @returns {Object} Mock response
 */
function mockResponse() {
  const res = {
    statusCode: 200,
    data: null,
    headers: {},
  };

  res.status = jest.fn((code) => {
    res.statusCode = code;
    return res;
  });

  res.json = jest.fn((data) => {
    res.data = data;
    return res;
  });

  res.send = jest.fn((data) => {
    res.data = data;
    return res;
  });

  res.setHeader = jest.fn((key, value) => {
    res.headers[key] = value;
    return res;
  });

  res.write = jest.fn();
  res.end = jest.fn();

  return res;
}

/**
 * Create a mock SSE response object
 * @returns {Object} Mock SSE response
 */
function mockSSEResponse() {
  const chunks = [];
  const res = mockResponse();

  res.write = jest.fn((chunk) => {
    chunks.push(chunk);
  });

  res.getChunks = () => chunks;

  return res;
}

/**
 * Validate quality score structure
 * @param {Object} score - Quality score object
 * @returns {boolean} True if valid
 */
function isValidQualityScore(score) {
  if (!score || typeof score !== 'object') return false;

  // Check required fields
  if (
    typeof score.totalScore !== 'number' ||
    score.totalScore < 0 ||
    score.totalScore > 100
  ) {
    return false;
  }

  if (
    typeof score.grade !== 'string' ||
    !['A', 'B', 'C', 'D', 'F'].includes(score.grade)
  ) {
    return false;
  }

  if (!score.breakdown || typeof score.breakdown !== 'object') {
    return false;
  }

  // Check breakdown fields
  const requiredFields = ['overview', 'installation', 'usage', 'api', 'structure'];
  for (const field of requiredFields) {
    if (typeof score.breakdown[field] !== 'number') {
      return false;
    }
  }

  return true;
}

/**
 * Validate parsed code structure
 * @param {Object} parsed - Parsed code object
 * @returns {boolean} True if valid
 */
function isValidParsedCode(parsed) {
  if (!parsed || typeof parsed !== 'object') return false;

  // Check required arrays
  if (!Array.isArray(parsed.functions)) return false;
  if (!Array.isArray(parsed.classes)) return false;
  if (!Array.isArray(parsed.exports)) return false;

  return true;
}

/**
 * Strip ANSI color codes from string
 * @param {string} str - String with ANSI codes
 * @returns {string} Clean string
 */
function stripAnsi(str) {
  return str.replace(/\u001b\[\d+m/g, '');
}

/**
 * Count occurrences of substring in string
 * @param {string} str - String to search
 * @param {string} substr - Substring to count
 * @returns {number} Count
 */
function countOccurrences(str, substr) {
  return (str.match(new RegExp(substr, 'g')) || []).length;
}

/**
 * Check if string contains all substrings
 * @param {string} str - String to search
 * @param {Array<string>} substrings - Substrings to find
 * @returns {boolean} True if all found
 */
function containsAll(str, substrings) {
  return substrings.every((substr) => str.includes(substr));
}

/**
 * Generate random string
 * @param {number} length - Length of string
 * @returns {string} Random string
 */
function randomString(length = 10) {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}

/**
 * Deep clone object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Wait for condition to be true
 * @param {Function} condition - Function that returns boolean
 * @param {number} timeout - Max wait time in ms
 * @param {number} interval - Check interval in ms
 * @returns {Promise<boolean>} True if condition met
 */
async function waitFor(condition, timeout = 5000, interval = 100) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await sleep(interval);
  }

  return false;
}

/**
 * Create a timeout promise
 * @param {number} ms - Timeout in milliseconds
 * @param {string} message - Error message
 * @returns {Promise<never>}
 */
function timeout(ms, message = 'Operation timed out') {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

module.exports = {
  sleep,
  mockRequest,
  mockResponse,
  mockSSEResponse,
  isValidQualityScore,
  isValidParsedCode,
  stripAnsi,
  countOccurrences,
  containsAll,
  randomString,
  deepClone,
  waitFor,
  timeout,
};
