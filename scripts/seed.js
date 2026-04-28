/**
 * seed.js — імпортує chapters.json і characters.json у Firebase Firestore
 * Запустити один раз: node scripts/seed.js
 *
 * Потрібно: FIREBASE_SERVICE_ACCOUNT у .env або як змінна середовища
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function seed() {
  const dataDir = path.join(__dirname, '..', 'data');

  // ── Chapters ──────────────────────────────────────────────────────────────
  const chapters = JSON.parse(fs.readFileSync(path.join(dataDir, 'chapters.json'), 'utf-8'));
  const chapBatch = db.batch();
  for (const ch of chapters) {
    const doc = { ...ch };
    // Remove scraper metadata not needed in Firestore
    delete doc.scrapedAt;
    chapBatch.set(db.collection('chapters').doc(String(ch.number)), doc);
  }
  await chapBatch.commit();
  console.log(`✓ Imported ${chapters.length} chapters`);

  // ── Characters ────────────────────────────────────────────────────────────
  const characters = JSON.parse(fs.readFileSync(path.join(dataDir, 'characters.json'), 'utf-8'));
  const charBatch = db.batch();
  for (const c of characters) {
    charBatch.set(db.collection('characters').doc(c.name), c);
  }
  await charBatch.commit();
  console.log(`✓ Imported ${characters.length} characters`);

  console.log('\n🎉 Seed complete!');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
