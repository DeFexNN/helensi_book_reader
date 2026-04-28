const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Завантажуємо дані
function loadData() {
  const dataDir = path.join(__dirname, 'data');
  
  try {
    const chapters = JSON.parse(fs.readFileSync(path.join(dataDir, 'chapters.json'), 'utf-8'));
    const characters = JSON.parse(fs.readFileSync(path.join(dataDir, 'characters.json'), 'utf-8'));
    return { chapters, characters };
  } catch (error) {
    console.error('Помилка завантаження даних:', error.message);
    return { chapters: [], characters: [] };
  }
}

// API Routes
app.get('/api/chapters.json', (req, res) => {
  const { chapters } = loadData();
  res.json(chapters);
});

app.get('/api/chapters/:number.json', (req, res) => {
  const { chapters } = loadData();
  const chapter = chapters.find(ch => ch.number === parseInt(req.params.number));
  
  if (!chapter) {
    return res.status(404).json({ error: 'Розділ не знайдений' });
  }
  
  res.json(chapter);
});

app.get('/api/characters.json', (req, res) => {
  const { characters } = loadData();
  res.json(characters);
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`📖 Сервер запущений на http://localhost:${PORT}`);
  console.log('Натисніть Ctrl+C щоб зупинити');
});
