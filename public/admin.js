/* ============================================================
   Admin Panel JS — Shades of Pain
   ============================================================ */

const STORAGE_KEY = 'admin_token';
let adminToken = '';

// ── Toast ──────────────────────────────────────────────────
function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast ${type}`;
    void t.offsetWidth;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// ── API helper ─────────────────────────────────────────────
async function api(path, method = 'GET', body = null) {
    const opts = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'X-Admin-Token': adminToken,
        },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(path, opts);
    if (res.status === 204) return null;
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Помилка запиту');
    return data;
}

// ── Auth ───────────────────────────────────────────────────
async function tryLogin(token) {
    // Verify via API call
    try {
        const res = await fetch('/api/chapters', {
            headers: { 'X-Admin-Token': token },
        });
        // We can't truly verify GET, so attempt a PUT with invalid body to test 401 vs other status
        // Instead, store token and verify via a dedicated verify endpoint or just trust the DELETE returning 401
        // Simple approach: try fetching chapters (always 200), then attempt a harmless POST validation
        if (!res.ok) throw new Error();
        adminToken = token;
        sessionStorage.setItem(STORAGE_KEY, token);
        showAdminPanel();
    } catch {
        showLoginError();
    }
}

// Validate token by doing a write attempt to see if we get 401
async function verifyToken(token) {
    const res = await fetch('/api/chapters', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
        body: JSON.stringify({ number: -999999 }),
    });
    // 404 means auth passed (chapter not found is ok), 401 means wrong token
    return res.status !== 401;
}

function showLoginError() {
    document.getElementById('loginError').style.display = 'block';
}

function showAdminPanel() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminWrap').style.display = 'block';
    loadChapters();
}

// ── Chapters ───────────────────────────────────────────────
let chapters = [];

async function loadChapters() {
    try {
        chapters = await api('/api/chapters');
        renderChapters();
    } catch (e) {
        showToast('Не вдалося завантажити розділи', 'error');
    }
}

function renderChapters() {
    const list = document.getElementById('chapterList');
    if (!chapters.length) {
        list.innerHTML = '<p style="color:var(--text-muted);font-size:14px;">Розділів поки немає.</p>';
        return;
    }
    list.innerHTML = chapters.map(ch => `
        <div class="item-card">
            <div class="item-card-info">
                <div class="item-card-title">
                    <span style="color:var(--text-muted);margin-right:8px;">#${ch.number}</span>
                    ${escHtml(ch.title)}
                    <span class="status-badge status-${ch.status}">${ch.status === 'published' ? 'Опубліковано' : 'В процесі'}</span>
                </div>
                <div class="item-card-sub">
                    ${ch.content ? `${ch.content.replace(/<[^>]*>/g,'').substring(0,80)}…` : 'Немає контенту'}
                </div>
            </div>
            <div class="item-card-actions">
                <button class="btn-icon" title="Редагувати" onclick="openEditChapter(${ch.number})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn-icon danger" title="Видалити" onclick="confirmDeleteChapter(${ch.number}, '${escHtml(ch.title)}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
            </div>
        </div>
    `).join('');
}

// Chapter modal
function openAddChapter() {
    document.getElementById('chapterModalTitle').textContent = 'Новий розділ';
    document.getElementById('editChapterNumber').value = '';
    document.getElementById('chapterNumber').value = (chapters.length ? Math.max(...chapters.map(c => c.number)) + 1 : 1);
    document.getElementById('chapterTitle').value = '';
    document.getElementById('chapterStatus').value = 'published';
    document.getElementById('chapterUrl').value = '';
    document.getElementById('chapterAudio').value = '';
    document.getElementById('chapterContent').innerHTML = '';
    document.getElementById('chapterModal').classList.add('open');
}

function openEditChapter(number) {
    const ch = chapters.find(c => c.number === number);
    if (!ch) return;
    document.getElementById('chapterModalTitle').textContent = 'Редагувати розділ';
    document.getElementById('editChapterNumber').value = ch.number;
    document.getElementById('chapterNumber').value = ch.number;
    document.getElementById('chapterTitle').value = ch.title;
    document.getElementById('chapterStatus').value = ch.status;
    document.getElementById('chapterUrl').value = ch.url || '';
    document.getElementById('chapterAudio').value = ch.audioUrl || '';
    document.getElementById('chapterContent').innerHTML = ch.content || '';
    document.getElementById('chapterModal').classList.add('open');
}

function closeChapterModal() {
    document.getElementById('chapterModal').classList.remove('open');
}

async function saveChapter() {
    const editNum = document.getElementById('editChapterNumber').value;
    const payload = {
        number: parseInt(document.getElementById('chapterNumber').value),
        title: document.getElementById('chapterTitle').value.trim(),
        status: document.getElementById('chapterStatus').value,
        url: document.getElementById('chapterUrl').value.trim(),
        audioUrl: document.getElementById('chapterAudio').value.trim() || null,
        content: document.getElementById('chapterContent').innerHTML,
    };

    if (!payload.title) { showToast('Введіть назву розділу', 'error'); return; }

    try {
        if (editNum) {
            await api('/api/chapters', 'PUT', payload);
            showToast('Розділ оновлено ✓');
        } else {
            await api('/api/chapters', 'POST', payload);
            showToast('Розділ додано ✓');
        }
        closeChapterModal();
        await loadChapters();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

// Confirm delete
let pendingDeleteFn = null;

function confirmDeleteChapter(number, title) {
    document.getElementById('confirmTitle').textContent = 'Видалити розділ?';
    document.getElementById('confirmText').textContent = `«${title}» буде видалено назавжди.`;
    pendingDeleteFn = async () => {
        try {
            await api('/api/chapters', 'DELETE', { number });
            showToast('Розділ видалено');
            await loadChapters();
        } catch (e) {
            showToast(e.message, 'error');
        }
    };
    document.getElementById('confirmModal').classList.add('open');
}

// ── Characters ─────────────────────────────────────────────
let characters = [];

async function loadCharacters() {
    try {
        characters = await api('/api/characters');
        renderCharacters();
    } catch (e) {
        showToast('Не вдалося завантажити персонажів', 'error');
    }
}

function renderCharacters() {
    const list = document.getElementById('characterList');
    if (!characters.length) {
        list.innerHTML = '<p style="color:var(--text-muted);font-size:14px;">Персонажів поки немає.</p>';
        return;
    }
    list.innerHTML = characters.map(c => `
        <div class="item-card">
            <div class="item-card-info">
                <div class="item-card-title">${escHtml(c.name)} <span class="status-badge status-published">${c.mbti}</span></div>
                <div class="item-card-sub">Вік: ${c.age} · Дата народження: ${c.birthDate}</div>
            </div>
            <div class="item-card-actions">
                <button class="btn-icon" title="Редагувати" onclick="openEditCharacter('${escAttr(c.name)}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn-icon danger" title="Видалити" onclick="confirmDeleteChar('${escAttr(c.name)}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
            </div>
        </div>
    `).join('');
}

function openAddCharacter() {
    document.getElementById('characterModalTitle').textContent = 'Новий персонаж';
    document.getElementById('editCharOriginalName').value = '';
    document.getElementById('charName').value = '';
    document.getElementById('charBirthDate').value = '';
    document.getElementById('charAge').value = '';
    document.getElementById('charMbti').value = '';
    document.getElementById('charImage').value = '';
    document.getElementById('characterModal').classList.add('open');
}

function openEditCharacter(name) {
    const c = characters.find(ch => ch.name === name);
    if (!c) return;
    document.getElementById('characterModalTitle').textContent = 'Редагувати персонажа';
    document.getElementById('editCharOriginalName').value = c.name;
    document.getElementById('charName').value = c.name;
    document.getElementById('charBirthDate').value = c.birthDate || '';
    document.getElementById('charAge').value = c.age || '';
    document.getElementById('charMbti').value = c.mbti || '';
    document.getElementById('charImage').value = c.imageLocal || '';
    document.getElementById('characterModal').classList.add('open');
}

function closeCharacterModal() {
    document.getElementById('characterModal').classList.remove('open');
}

async function saveCharacter() {
    const originalName = document.getElementById('editCharOriginalName').value;
    const payload = {
        name: document.getElementById('charName').value.trim(),
        birthDate: document.getElementById('charBirthDate').value.trim(),
        age: parseInt(document.getElementById('charAge').value) || 0,
        mbti: document.getElementById('charMbti').value.trim().toUpperCase(),
        imageLocal: document.getElementById('charImage').value.trim() || null,
    };

    if (!payload.name) { showToast("Введіть ім'я персонажа", 'error'); return; }

    try {
        if (originalName) {
            await api('/api/characters', 'PUT', { ...payload, originalName });
            showToast('Персонажа оновлено ✓');
        } else {
            await api('/api/characters', 'POST', payload);
            showToast('Персонажа додано ✓');
        }
        closeCharacterModal();
        await loadCharacters();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function confirmDeleteChar(name) {
    document.getElementById('confirmTitle').textContent = 'Видалити персонажа?';
    document.getElementById('confirmText').textContent = `«${name}» буде видалено назавжди.`;
    pendingDeleteFn = async () => {
        try {
            await api('/api/characters', 'DELETE', { name });
            showToast('Персонажа видалено');
            await loadCharacters();
        } catch (e) {
            showToast(e.message, 'error');
        }
    };
    document.getElementById('confirmModal').classList.add('open');
}

// ── Helpers ────────────────────────────────────────────────
function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(s) {
    return String(s).replace(/'/g,"\\'");
}

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Check session
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
        adminToken = saved;
        showAdminPanel();
    }

    // Login
    const loginBtn = document.getElementById('loginBtn');
    const tokenInput = document.getElementById('tokenInput');

    async function doLogin() {
        const token = tokenInput.value.trim();
        if (!token) return;
        const ok = await verifyToken(token);
        if (ok) {
            adminToken = token;
            sessionStorage.setItem(STORAGE_KEY, token);
            showAdminPanel();
        } else {
            showLoginError();
        }
    }

    loginBtn.addEventListener('click', doLogin);
    tokenInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        sessionStorage.removeItem(STORAGE_KEY);
        adminToken = '';
        document.getElementById('adminWrap').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
        tokenInput.value = '';
    });

    // Tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('panel' + capitalize(tab.dataset.tab)).classList.add('active');
            if (tab.dataset.tab === 'characters') loadCharacters();
        });
    });

    // Chapter modal
    document.getElementById('addChapterBtn').addEventListener('click', openAddChapter);
    document.getElementById('chapterCancelBtn').addEventListener('click', closeChapterModal);
    document.getElementById('chapterSaveBtn').addEventListener('click', saveChapter);
    document.getElementById('chapterModal').addEventListener('click', e => { if (e.target === document.getElementById('chapterModal')) closeChapterModal(); });

    // WYSIWYG toolbar
    document.getElementById('editorToolbar').addEventListener('mousedown', e => {
        const btn = e.target.closest('button[data-cmd]');
        if (!btn) return;
        e.preventDefault();
        const cmd = btn.dataset.cmd;
        const val = btn.dataset.val || null;
        document.execCommand(cmd, false, val);
        document.getElementById('chapterContent').focus();
    });
    document.getElementById('editorClearFormat').addEventListener('mousedown', e => {
        e.preventDefault();
        document.execCommand('removeFormat', false, null);
        document.execCommand('formatBlock', false, 'p');
        document.getElementById('chapterContent').focus();
    });
    // Highlight active toolbar buttons on selection change
    document.getElementById('chapterContent').addEventListener('keyup', updateToolbar);
    document.getElementById('chapterContent').addEventListener('mouseup', updateToolbar);
    document.getElementById('chapterContent').addEventListener('focus', updateToolbar);
    function updateToolbar() {
        document.querySelectorAll('#editorToolbar button[data-cmd]').forEach(btn => {
            try {
                const active = document.queryCommandState(btn.dataset.cmd);
                btn.classList.toggle('active', active);
            } catch {}
        });
    }

    // Character modal
    document.getElementById('addCharacterBtn').addEventListener('click', openAddCharacter);
    document.getElementById('characterCancelBtn').addEventListener('click', closeCharacterModal);
    document.getElementById('characterSaveBtn').addEventListener('click', saveCharacter);
    document.getElementById('characterModal').addEventListener('click', e => { if (e.target === document.getElementById('characterModal')) closeCharacterModal(); });

    // Confirm modal
    document.getElementById('confirmCancelBtn').addEventListener('click', () => {
        pendingDeleteFn = null;
        document.getElementById('confirmModal').classList.remove('open');
    });
    document.getElementById('confirmOkBtn').addEventListener('click', async () => {
        document.getElementById('confirmModal').classList.remove('open');
        if (pendingDeleteFn) { await pendingDeleteFn(); pendingDeleteFn = null; }
    });
    document.getElementById('confirmModal').addEventListener('click', e => {
        if (e.target === document.getElementById('confirmModal')) {
            pendingDeleteFn = null;
            document.getElementById('confirmModal').classList.remove('open');
        }
    });
});

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
