// Script to clean chapter content: remove <h1> headers, <address> blocks with Helensia_ga links
const fs = require('fs');
const path = require('path');

const chaptersPath = path.join(__dirname, 'data', 'chapters.json');
const chapters = JSON.parse(fs.readFileSync(chaptersPath, 'utf-8'));

let totalCleaned = 0;

chapters.forEach(chapter => {
  if (!chapter.content) return;
  
  const original = chapter.content;
  
  // Remove <h1>...</h1> tags (chapter title duplicated in content)
  let cleaned = original.replace(/<h1[^>]*>.*?<\/h1>/gi, '');
  
  // Remove <address>...</address> blocks (contains Helensia_ga link or author byline)
  cleaned = cleaned.replace(/<address[^>]*>.*?<\/address>/gi, '');
  
  // Trim leading whitespace / empty paragraphs
  cleaned = cleaned.replace(/^(\s|<br\s*\/?>|<p>\s*<\/p>|<p>\s*&nbsp;\s*<\/p>)+/gi, '');
  
  if (cleaned !== original) {
    chapter.content = cleaned;
    totalCleaned++;
    console.log(`✅ Cleaned chapter ${chapter.number}: "${chapter.title}"`);
  } else {
    console.log(`⏭️  Chapter ${chapter.number}: already clean`);
  }
});

fs.writeFileSync(chaptersPath, JSON.stringify(chapters, null, 2), 'utf-8');
console.log(`\n🎉 Done! Cleaned ${totalCleaned} out of ${chapters.length} chapters.`);
