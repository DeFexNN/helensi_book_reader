# Відтінки болю — Netlify + Firebase

Веб-читалка психологічного трилера «Відтінки болю» із адмін-панеллю.  
БД: **Google Firebase Firestore**.

## Структура

```
new/
├── netlify/
│   └── functions/
│       ├── _firebase.js     — ініціалізація Firebase Admin SDK
│       ├── chapters.js      — API: GET/POST/PUT/DELETE /api/chapters
│       └── characters.js    — API: GET/POST/PUT/DELETE /api/characters
├── public/
│   ├── index.html           — головна сторінка читача
│   ├── styles.css           — стилі
│   ├── script.js            — логіка читача
│   ├── admin.html           — адмін-панель (/admin.html)
│   ├── admin.js             — логіка адмін-панелі
│   └── img/                 — ілюстрації персонажів
├── data/                    — початкові JSON (для імпорту у Firebase)
│   ├── chapters.json
│   └── characters.json
├── netlify.toml
└── package.json
```

## Налаштування Firebase

1. Перейди на [console.firebase.google.com](https://console.firebase.google.com)
2. Створи новий проект (або використай існуючий)
3. **Firestore Database** → Create database → Production mode
4. **Project Settings → Service accounts** → Generate new private key → скачай JSON
5. Відкрий скачаний JSON, скопіюй **весь вміст** (це буде `FIREBASE_SERVICE_ACCOUNT`)

## Розгортання на Netlify

1. Push проект на GitHub / GitLab
2. Підключити репозиторій → **New site from Git**
3. Build command: *(порожньо або `echo ok`)*
4. Publish directory: `public`
5. Functions directory: `netlify/functions`
6. **Site settings → Environment variables** → додати:

| Змінна | Значення |
|---|---|
| `ADMIN_TOKEN` | ваш секретний пароль для адміну |
| `FIREBASE_SERVICE_ACCOUNT` | весь JSON з Firebase service account (в один рядок) |

> Щоб перетворити JSON в один рядок для Netlify:  
> `cat serviceAccount.json | jq -c .`  
> або просто вставте весь текст JSON у поле — Netlify зберігає його правильно.

## Імпорт початкових даних у Firestore

Файли `data/chapters.json` і `data/characters.json` містять всі поточні дані.  
Щоб завантажити їх у Firestore, запусти скрипт:

```bash
node scripts/seed.js
```

*(або додай вручну через Firebase Console → Firestore)*

## Адмін-панель

URL: `https://ваш-сайт.netlify.app/admin.html`

Вводьте `ADMIN_TOKEN` в поле пароля.

- **Розділи** — додавання, редагування, видалення
- **Персонажі** — CRUD для персонажів

## Локальна розробка

```bash
npm install
```

Створи файл `.env` у корені:
```
ADMIN_TOKEN=test123
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...весь JSON..."}
```

```bash
npx netlify dev
```

Сайт: http://localhost:8888  
Адмін: http://localhost:8888/admin.html
