// URL and text normalization utilities

const TRACKING_PARAMS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'ref', 'source', 'fbclid', 'gclid', 'gad_source', 'mc_cid', 'mc_eid',
  'msclkid', 'twclid', 'igshid', 'si', 'feature', 'context',
  '_hsenc', '_hsmi', 'hss_channel', 'trk', 'trkInfo',
]);

/**
 * Normalize a URL to a canonical form:
 * - lowercase host
 * - strip tracking params
 * - remove fragments
 * - remove trailing slashes (except root)
 * - normalize protocol to https
 */
export function canonicalizeURL(rawURL) {
  if (!rawURL || typeof rawURL !== 'string') return rawURL || '';
  try {
    const url = new URL(rawURL);
    url.protocol = 'https:';
    url.hostname = url.hostname.toLowerCase();
    url.hash = '';

    // Remove tracking params
    for (const key of [...url.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(key.toLowerCase())) {
        url.searchParams.delete(key);
      }
    }

    // Sort remaining params for consistency
    url.searchParams.sort();

    let result = url.toString();
    // Remove trailing slash unless it's the root
    if (result.endsWith('/') && url.pathname !== '/') {
      result = result.slice(0, -1);
    }
    return result;
  } catch {
    return rawURL;
  }
}

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'can', 'shall', 'that', 'this',
  'these', 'those', 'it', 'its', 'not', 'no', 'nor', 'so', 'if', 'then',
  'than', 'too', 'very', 'just', 'about', 'above', 'after', 'before',
  'how', 'what', 'when', 'where', 'which', 'who', 'whom', 'why',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
  'some', 'such', 'only', 'own', 'same', 'also', 'into', 'out',
  'up', 'down', 'over', 'under', 'again', 'here', 'there', 'we',
  'our', 'you', 'your', 'they', 'their', 'he', 'she', 'his', 'her',
  'i', 'me', 'my', 'as', 'vs', 'via',
]);

/**
 * Tokenize text: lowercase, remove punctuation, split, filter stopwords.
 * Returns sorted unique tokens.
 */
export function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return [...new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1 && !STOPWORDS.has(t))
  )].sort();
}

/**
 * Jaccard similarity between two token sets.
 * Returns 0–1.
 */
export function jaccardSimilarity(tokensA, tokensB) {
  if (!tokensA.length || !tokensB.length) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Simple stable hash from a string. Returns hex string.
 */
export function stableHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Strip HTML tags from text.
 */
export function stripHTML(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
