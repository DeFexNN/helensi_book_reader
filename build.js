const fs = require('fs');
const path = require('path');

console.log('Починаємо збірку сторінки для GitHub Pages...');

// Створюємо папку api всередині public
const pubApiDir = path.join(__dirname, 'public', 'api');
if (!fs.existsSync(pubApiDir)) {
    fs.mkdirSync(pubApiDir, { recursive: true });
}

// Копіюємо json файли
fs.copyFileSync(path.join(__dirname, 'data', 'chapters.json'), path.join(pubApiDir, 'chapters.json'));
fs.copyFileSync(path.join(__dirname, 'data', 'characters.json'), path.join(pubApiDir, 'characters.json'));

console.log('Build завершено! Дані скопійовано у /public/api для статичного хостингу.');
