/**
 * Generates a deterministic idempotency key based on request content
 * Same request content = same key (allows retries to be idempotent)
 * Different request content = different key
 * 
 * @param {string} endpoint - The API endpoint path
 * @param {Object|FormData|string|null} body - The request body
 * @returns {Promise<string>} A deterministic idempotency key
 */
export const generateIdempotencyKey = async (endpoint, body) => {
  let requestString = endpoint;
  
  if (body) {
    if (body instanceof FormData) {
      // Convert FormData to an object for consistent hashing
      const formObj = {};
      for (const [key, value] of body.entries()) {
        if (value instanceof File) {
          // For files, use name, size, and type for hashing
          formObj[key] = {
            type: 'file',
            name: value.name,
            size: value.size,
            fileType: value.type,
          };
        } else {
          formObj[key] = value;
        }
      }
      const sortedBody = JSON.stringify(sortObjectDeep(formObj));
      requestString += '|' + sortedBody;
    } else if (typeof body === 'string') {
      requestString += '|' + body;
    } else {
      const sortedBody = JSON.stringify(sortObjectDeep(body));
      requestString += '|' + sortedBody;
    }
  }
  
  const hash = await sha256(requestString);
  return `idemp-${hash}`;
};

/**
 * Deep sorts object keys recursively for consistent hashing
 * @param {any} obj - Object, array, or primitive to sort
 * @returns {any} Sorted object/array/primitive
 */
function sortObjectDeep(obj) {
  if (Array.isArray(obj)) return obj.map(sortObjectDeep);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).sort().reduce((res, key) => {
      res[key] = sortObjectDeep(obj[key]);
      return res;
    }, {});
  }
  return obj;
}

/**
 * Creates a SHA-256 hash of a string
 * @param {string} str - String to hash
 * @returns {Promise<string>} Hexadecimal hash string
 */
async function sha256(str) {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

