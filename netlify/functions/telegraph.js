// Proxy: fetch a Telegraph article and return its HTML content
const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: HEADERS, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };

  const url = event.queryStringParameters?.url;
  if (!url) return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Missing url parameter' }) };

  // Only allow telegra.ph URLs
  if (!/^https?:\/\/(www\.)?telegra\.ph\//i.test(url)) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Only telegra.ph URLs are allowed' }) };
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ShadesOfPainBot/1.0)' },
    });
    if (!res.ok) throw new Error(`Telegraph returned ${res.status}`);
    const html = await res.text();

    // Extract <article> content
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (!articleMatch) return { statusCode: 422, headers: HEADERS, body: JSON.stringify({ error: 'Could not find article content' }) };

    let content = articleMatch[1];

    // Remove title (h1), author (address), and header meta — not part of chapter text
    content = content
      .replace(/<h1[\s\S]*?<\/h1>/gi, '')
      .replace(/<address[\s\S]*?<\/address>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<figure[\s\S]*?<\/figure>/gi, '')   // remove images
      .replace(/<aside[\s\S]*?<\/aside>/gi, '')      // remove aside
      .replace(/<script[\s\S]*?<\/script>/gi, '')    // remove scripts
      .replace(/<h4([^>]*)>/gi, '<h3$1>')            // normalize h4→h3
      .replace(/<\/h4>/gi, '</h3>')
      .replace(/<a\s[^>]*>([\s\S]*?)<\/a>/gi, '$1') // strip links, keep text
      .replace(/\s+/g, ' ')
      .trim();

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ content }) };
  } catch (e) {
    return { statusCode: 502, headers: HEADERS, body: JSON.stringify({ error: e.message }) };
  }
};
