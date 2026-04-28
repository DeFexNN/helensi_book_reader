const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const chapters = [
  {
    number: 1,
    title: 'Розділ 1',
    url: 'https://telegra.ph/Rozd%D1%96l-1-10-16-3',
    audioUrl: 'https://t.me/Helensi_writer/77',
    status: 'published'
  },
  {
    number: 2,
    title: 'Розділ 2',
    url: 'https://telegra.ph/Rozd%D1%96l-2-07-26',
    audioUrl: 'https://t.me/Helensi_writer/95',
    status: 'published'
  },
  {
    number: 3,
    title: 'Розділ 3',
    url: 'https://telegra.ph/Rozd%D1%96l-3-04-08-2',
    audioUrl: 'https://t.me/Helensi_writer/129',
    status: 'published'
  },
  {
    number: 4,
    title: 'Розділ 4',
    url: 'https://telegra.ph/Rozd%D1%96l-4-04-08-4',
    audioUrl: 'https://t.me/Helensi_writer/395',
    status: 'published'
  },
  {
    number: 5,
    title: 'Розділ 5',
    url: 'https://telegra.ph/Rozd%D1%96l-5-04-08-2',
    status: 'published'
  },
  {
    number: 6,
    title: 'Розділ 6',
    url: 'https://telegra.ph/Rozd%D1%96l-6-07-28-5',
    status: 'published'
  },
  {
    number: 7,
    title: 'Розділ 7',
    url: 'https://telegra.ph/Rozd%D1%96l-7-07-30-2',
    status: 'published'
  },
  {
    number: 8,
    title: 'Розділ 8',
    url: 'https://telegra.ph/Rozd%D1%96l-8-07-28-4',
    status: 'published'
  },
  {
    number: 9,
    title: 'Розділ 9',
    url: 'https://telegra.ph/Rozd%D1%96l-9-07-27-8',
    status: 'published'
  },
  {
    number: 10,
    title: 'Розділ 10',
    url: 'https://telegra.ph/Rozd%D1%96l-10-07-30',
    status: 'published'
  },
  {
    number: 11,
    title: 'Розділ 11',
    url: 'https://telegra.ph/Rozd%D1%96l-11-07-29',
    status: 'published'
  },
  {
    number: 12,
    title: 'Розділ 12',
    url: 'https://t.me/Helensi_writer/161',
    status: 'published'
  },
  {
    number: 13,
    title: 'Розділ 13',
    url: 'https://telegra.ph/Rozd%D1%96l-13-08-08',
    status: 'published'
  },
  {
    number: 14,
    title: 'Розділ 14',
    url: 'https://telegra.ph/Rozd%D1%96l-14-08-14',
    status: 'published'
  },
  {
    number: 15,
    title: 'Розділ 15',
    url: 'https://telegra.ph/Rozd%D1%96l-15-10-20-3',
    status: 'published'
  },
  {
    number: 16,
    title: 'Розділ 16',
    url: 'https://t.me/Helensi_writer/292',
    status: 'published'
  },
  {
    number: 17,
    title: 'Розділ 17',
    url: 'https://telegra.ph/Rozd%D1%96l-17-02-15',
    status: 'published'
  },
  {
    number: 18,
    title: 'Розділ 18',
    url: 'https://t.me/Helensi_writer/373',
    status: 'published'
  },
  {
    number: 19,
    title: 'Розділ 19',
    status: 'in_progress'
  }
];

const characters = [
  {
    name: 'Артур Рейнс',
    birthDate: '17.01',
    age: 34,
    mbti: 'INTJ',
    imageUrl: 'https://t.me/Helensi_writer/20'
  },
  {
    name: 'Домінік Вейл',
    birthDate: '23.05',
    age: 22,
    mbti: 'INFP',
    imageUrl: 'https://t.me/Helensi_writer/25'
  },
  {
    name: 'Джейк Міллер',
    birthDate: '03.08',
    age: 23,
    mbti: 'ESFP',
    imageUrl: 'https://t.me/Helensi_writer/111'
  },
  {
    name: 'Марта Міллер',
    birthDate: '11.11',
    age: 28,
    mbti: 'ENFP',
    imageUrl: 'https://t.me/Helensi_writer/344'
  }
];

async function scrapeChapter(url) {
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
    
    const response = await axios.get(url, { headers, timeout: 10000 });
    const $ = cheerio.load(response.data);
    
    // Telegraph articles typically have content in <article> or similar divs
    let content = '';
    
    if (url.includes('telegra.ph')) {
      const article = $('article').html() || $('.tl_page_content').html() || $('body').html();
      content = article ? article.trim() : '';
    } else if (url.includes('t.me')) {
      // For Telegram, we'll just return a placeholder
      content = '<p>Вміст недоступний для автоматичного скрейпінгу з Telegram</p>';
    }
    
    return content;
  } catch (error) {
    console.error(`Помилка скрейпінгу ${url}:`, error.message);
    return null;
  }
}

async function scrapeAllChapters() {
  console.log('🚀 Початок скрейпінгу розділів...');
  
  const chaptersData = [];
  
  for (const chapter of chapters) {
    if (!chapter.url) {
      chaptersData.push({
        ...chapter,
        content: '<p>Розділ ще не опубліковано</p>'
      });
      continue;
    }
    
    console.log(`⏳ Скрейпинг ${chapter.title}...`);
    const content = await scrapeChapter(chapter.url);
    
    chaptersData.push({
      ...chapter,
      content: content || '<p>Помилка при завантаженні контенту</p>',
      scrapedAt: new Date().toISOString()
    });
    
    // Затримка між запитами щоб не перевантажити сервер
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Зберігаємо дані
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }
  
  fs.writeFileSync(
    path.join(dataDir, 'chapters.json'),
    JSON.stringify(chaptersData, null, 2),
    'utf-8'
  );
  
  fs.writeFileSync(
    path.join(dataDir, 'characters.json'),
    JSON.stringify(characters, null, 2),
    'utf-8'
  );
  
  console.log('✅ Скрейпинг завершено!');
  console.log(`📝 Збережено ${chaptersData.length} розділів`);
}

// Запуск скрейпера
scrapeAllChapters().catch(console.error);
