const { db } = require('./_firebase');
const COL = 'characters';
const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};
function authCheck(event) {
  const token = event.headers['x-admin-token'] || '';
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'change-me';
  return token === ADMIN_TOKEN;
}
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: HEADERS, body: '' };
  if (event.httpMethod === 'GET') {
    const snap = await db.collection(COL).get();
    const chars = snap.docs.map(d => d.data());
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify(chars) };
  }
  if (!authCheck(event)) {
    return { statusCode: 401, headers: HEADERS, body: JSON.stringify({ error: 'Unauthorized' }) };
  }
  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }
  if (event.httpMethod === 'POST') {
    if (!body.name) return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'name required' }) };
    const char = {
      name: body.name,
      birthDate: body.birthDate || '',
      age: body.age || 0,
      mbti: body.mbti || '',
      imageLocal: body.imageLocal || null,
      imageUrl: body.imageUrl || null,
    };
    await db.collection(COL).doc(body.name).set(char);
    return { statusCode: 201, headers: HEADERS, body: JSON.stringify(char) };
  }
  if (event.httpMethod === 'PUT') {
    const originalName = body.originalName || body.name;
    const ref = db.collection(COL).doc(originalName);
    const doc = await ref.get();
    if (!doc.exists) return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ error: 'Not found' }) };
    const updated = { ...doc.data(), ...body };
    delete updated.originalName;
    if (body.name && body.name !== originalName) {
      await db.collection(COL).doc(originalName).delete();
      await db.collection(COL).doc(body.name).set(updated);
    } else {
      await ref.set(updated);
    }
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify(updated) };
  }
  if (event.httpMethod === 'DELETE') {
    const doc = await db.collection(COL).doc(body.name).get();
    if (!doc.exists) return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ error: 'Not found' }) };
    await db.collection(COL).doc(body.name).delete();
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true }) };
  }
  return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
};