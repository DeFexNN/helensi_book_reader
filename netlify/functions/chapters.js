const { db } = require('./_firebase');
const COL = 'chapters';
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
    const snap = await db.collection(COL).orderBy('number').get();
    const chapters = snap.docs.map(d => d.data());
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify(chapters) };
  }
  if (!authCheck(event)) {
    return { statusCode: 401, headers: HEADERS, body: JSON.stringify({ error: 'Unauthorized' }) };
  }
  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }
  if (event.httpMethod === 'POST') {
    if (!body.number) {
      const snap = await db.collection(COL).orderBy('number', 'desc').limit(1).get();
      body.number = snap.empty ? 1 : snap.docs[0].data().number + 1;
    }
    const docId = String(body.number);
    const existing = await db.collection(COL).doc(docId).get();
    if (existing.exists) {
      return { statusCode: 409, headers: HEADERS, body: JSON.stringify({ error: 'Chapter number already exists' }) };
    }
    const chapter = {
      number: body.number,
      title: body.title || ('Розділ ' + body.number),
      url: body.url || '',
      status: body.status || 'published',
      content: body.content || '',
      audioUrl: body.audioUrl || null,
      createdAt: new Date().toISOString(),
    };
    await db.collection(COL).doc(docId).set(chapter);
    return { statusCode: 201, headers: HEADERS, body: JSON.stringify(chapter) };
  }
  if (event.httpMethod === 'PUT') {
    const docId = String(body.number);
    const ref = db.collection(COL).doc(docId);
    const doc = await ref.get();
    if (!doc.exists) return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ error: 'Not found' }) };
    const updated = { ...doc.data(), ...body, number: doc.data().number, updatedAt: new Date().toISOString() };
    await ref.set(updated);
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify(updated) };
  }
  if (event.httpMethod === 'DELETE') {
    const docId = String(body.number);
    const doc = await db.collection(COL).doc(docId).get();
    if (!doc.exists) return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ error: 'Not found' }) };
    await db.collection(COL).doc(docId).delete();
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true }) };
  }
  return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
};