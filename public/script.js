/* ============================================
   Shades of Pain — Reader App
   ============================================ */

let allChapters = [];
let currentChapter = null;

let readMode = localStorage.getItem('readMode') || 'scroll'; // 'scroll' or 'paged'
let savedChapterNum = parseInt(localStorage.getItem('savedChapter'), 10) || null;

let pagedContentHTML = [];
let currentPageIndex = 0;

// DOM refs
const els = {};

document.addEventListener('DOMContentLoaded', async () => {
    cacheElements();
    await loadChapters();
    renderChaptersList();
    setupEventListeners();
    loadCharacters();
    renderHeroStats();
});

function cacheElements() {
    els.sidebar        = document.getElementById('sidebar');
    els.sidebarOverlay = document.getElementById('sidebarOverlay');
    els.menuToggle     = document.getElementById('menuToggle');
    els.sidebarClose   = document.getElementById('sidebarClose');
    els.chaptersMenu   = document.getElementById('chaptersMenu');
    els.heroSection    = document.getElementById('heroSection');
    els.readerSection  = document.getElementById('readerSection');
    els.contentContainer = document.getElementById('contentContainer');
    els.prevBtn        = document.getElementById('prevBtn');
    els.nextBtn        = document.getElementById('nextBtn');
    els.chapterCounter = document.getElementById('chapterCounter');
    els.charactersBtn  = document.getElementById('charactersBtn');
    els.heroCharactersBtn = document.getElementById('heroCharactersBtn');
    els.startReadingBtn = document.getElementById('startReadingBtn');
    els.backToHomeBtn  = document.getElementById('backToHomeBtn');
    els.characterSection = document.getElementById('characterSection');
    els.characterBackBtn = document.getElementById('characterBackBtn');
    els.characterPageContainer = document.getElementById('characterPageContainer');
    els.modal          = document.getElementById('charactersModal');
    els.modalCloseBtn  = document.getElementById('modalCloseBtn');
    els.charactersList = document.getElementById('charactersList');
    els.heroStats      = document.getElementById('heroStats');
    els.mobileHeader   = document.getElementById('mobileHeader');

    els.continueBanner = document.getElementById('continueReadingBanner');
    els.continueBtn    = document.getElementById('continueReadingBtn');
    els.continueChapterName = document.getElementById('continueChapterName');
    
    els.modeToggleBtn  = document.getElementById('modeToggleBtn');
    els.modeToggleText = document.getElementById('modeToggleText');
    
    els.pagedNav       = document.getElementById('pagedNav');
    els.pagedPrevBtn   = document.getElementById('pagedPrevBtn');
    els.pagedNextBtn   = document.getElementById('pagedNextBtn');
    els.pagedCurrent   = document.getElementById('pagedCurrent');
    els.pagedTotal     = document.getElementById('pagedTotal');
}

// ─── Data Loading ────────────────────────────
async function loadChapters() {
    try {
        const res = await fetch('/api/chapters');
        allChapters = await res.json();
    } catch (e) {
        console.error('Помилка завантаження розділів:', e);
    }
}

async function loadCharacters() {
    try {
        const res = await fetch('/api/characters');
        const chars = await res.json();
        renderCharacters(chars);
    } catch (e) {
        console.error('Помилка завантаження персонажів:', e);
    }
}

// ─── Render Chapters Menu ────────────────────
function renderChaptersList() {
    els.chaptersMenu.innerHTML = '';
    allChapters.forEach(ch => {
        const a = document.createElement('a');
        a.href = '#';
        a.className = 'chapter-item' + (ch.status === 'in_progress' ? ' in-progress' : '');
        a.innerHTML = `<span class="ch-num">${ch.number}</span>${ch.title}`;
        if (ch.status !== 'in_progress') {
            a.addEventListener('click', e => {
                e.preventDefault();
                openChapter(ch.number);
                closeSidebar();
            });
        }
        els.chaptersMenu.appendChild(a);
    });
}

function updateActiveChapter(num) {
    document.querySelectorAll('.chapter-item').forEach((el, i) => {
        el.classList.toggle('active', allChapters[i]?.number === num);
    });
}

// ─── Chapter Loading ─────────────────────────
function openChapter(number) {
    const chapter = allChapters.find(c => c.number === number);
    if (!chapter) return;

    currentChapter = chapter;
    updateActiveChapter(number);

    // Switch from hero to reader
    els.heroSection.style.display = 'none';
    els.readerSection.style.display = '';
    if (els.characterSection) els.characterSection.style.display = 'none';

    renderChapterContent(chapter);
    updateNavigation(number);
    updateChapterCounter(number);

    // Scroll to top of reader
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showHero() {
    currentChapter = null;
    els.heroSection.style.display = '';
    els.readerSection.style.display = 'none';
    if (els.characterSection) els.characterSection.style.display = 'none';
    updateActiveChapter(-1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderChapterContent(chapter) {
    const container = els.contentContainer;

    // Save progress
    localStorage.setItem('savedChapter', chapter.number);
    savedChapterNum = chapter.number;
    
    // Update continue banner state if on hero page
    updateContinueBanner();

    if (chapter.status === 'in_progress') {
        els.pagedNav.style.display = 'none';
        container.innerHTML = `
            <div class="chapter-header">
                <h2>${chapter.title}</h2>
                <p class="chapter-meta">Розділ в процесі написання…</p>
            </div>
            <div class="chapter-content" style="text-align:center; padding: 60px 0; color: var(--text-muted);">
                <p>Скоро буде готово ⏳</p>
            </div>
        `;
        return;
    }

    if (readMode === 'paged' && chapter.content && chapter.content !== '<p>Помилка при завантаженні контенту</p>') {
        els.pagedNav.style.display = 'flex';
        buildPagedContent(chapter);
        renderCurrentPage();
    } else {
        els.pagedNav.style.display = 'none';
        let html = `
            <div class="chapter-header">
                <h2>${chapter.title}</h2>
                <p class="chapter-meta">Читайте обережно — вміст містить гостросоціальні теми</p>
            </div>
        `;

        if (chapter.content && chapter.content !== '<p>Помилка при завантаженні контенту</p>') {
            html += `<div class="chapter-content">${sanitizeHTML(chapter.content)}</div>`;
        } else {
            html += `
                <div class="chapter-content" style="text-align:center; padding: 60px 0;">
                    <p style="color: var(--text-muted);">
                        Вміст розділу недоступний.<br/>
                        <a href="${chapter.url}" target="_blank" style="color: var(--accent-light);">Читати оригінал →</a>
                    </p>
                </div>
            `;
        }

        if (chapter.audioUrl) {
            html += `
                <div class="chapter-audio">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
                    <a href="${chapter.audioUrl}" target="_blank">Слухайте озвучку на Telegram →</a>
                </div>
            `;
        }

        container.innerHTML = html;
        container.classList.remove('reader-content');
        void container.offsetWidth;
        container.classList.add('reader-content');
    }
}

function buildPagedContent(chapter) {
    pagedContentHTML = [];
    currentPageIndex = 0;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitizeHTML(chapter.content);
    
    const elements = Array.from(tempDiv.children);
    
    let currentChunk = `<div class="chapter-header" style="margin-bottom:20px;"><h2>${chapter.title}</h2><p class="chapter-meta">Читайте обережно — вміст містить гостросоціальні теми</p></div>`;
    let currentLength = 0;
    const CHUNK_LIMIT = 1500;
    
    for (const el of elements) {
        const elLength = el.textContent.length || 0;
        if (currentLength + elLength > CHUNK_LIMIT && currentLength > 0) {
            pagedContentHTML.push(currentChunk);
            currentChunk = '';
            currentLength = 0;
        }
        currentChunk += el.outerHTML;
        currentLength += elLength;
    }
    
    if (currentChunk.trim().length > 0) {
        pagedContentHTML.push(currentChunk);
    }
    
    if (chapter.audioUrl) {
        const audioHtml = `
            <div class="chapter-audio">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
                <a href="${chapter.audioUrl}" target="_blank">Слухайте озвучку на Telegram →</a>
            </div>
        `;
        if (pagedContentHTML.length > 0) {
            pagedContentHTML[pagedContentHTML.length - 1] += audioHtml;
        } else {
            pagedContentHTML.push(audioHtml);
        }
    }
    
    if (pagedContentHTML.length === 0) pagedContentHTML.push('<p>Порожньо</p>');
}

function renderCurrentPage() {
    els.contentContainer.innerHTML = `<div class="chapter-content" style="animation: readerFadeIn 0.3s var(--ease-out) both;">${pagedContentHTML[currentPageIndex]}</div>`;
    
    els.pagedCurrent.textContent = currentPageIndex + 1;
    els.pagedTotal.textContent = pagedContentHTML.length;
    
    els.pagedPrevBtn.disabled = currentPageIndex === 0;
    // Remove disable state on pagedNextBtn because next could go to next chapter
    els.pagedNextBtn.disabled = false;
    
    // Instead of scrolling to top smoothly, we instantly cut to top so page feeling is solid
    window.scrollTo({ top: 0, behavior: 'auto' });
}

function sanitizeHTML(html) {
    return html
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/on\w+\s*=/gi, '');
}

// ─── Navigation ──────────────────────────────
function updateNavigation(num) {
    const prev = allChapters.find(c => c.number === num - 1);
    const next = allChapters.find(c => c.number === num + 1);
    els.prevBtn.disabled = !prev || prev.status === 'in_progress';
    els.nextBtn.disabled = !next || next.status === 'in_progress';
}

function updateChapterCounter(num) {
    const published = allChapters.filter(c => c.status === 'published').length;
    els.chapterCounter.textContent = `${num} / ${published}`;
}

// ─── Characters ──────────────────────────────
function renderCharacters(characters) {
    els.charactersList.innerHTML = '';
    characters.forEach(c => {
        const initials = c.name.split(' ').map(w => w[0]).join('');
        const avatarHtml = c.imageLocal 
            ? `<img src="${c.imageLocal}" alt="${c.name}" class="char-img">`
            : initials;
        const card = document.createElement('div');
        card.className = 'character-card';
        card.innerHTML = `
            <div class="char-avatar">${avatarHtml}</div>
            <h3>${c.name}</h3>
            <p>Дата народження: ${c.birthDate}</p>
            <p>Вік: ${c.age} років</p>
            <span class="mbti">${c.mbti}</span>
        `;
        els.charactersList.appendChild(card);
        card.addEventListener('click', () => {
            openCharacterPage(c);
        });
    });
}

function openCharacterPage(character) {
    closeModal();
    closeSidebar();
    els.heroSection.style.display = 'none';
    els.readerSection.style.display = 'none';
    if (els.characterSection) els.characterSection.style.display = 'flex';
    
    updateActiveChapter(-1);
    currentChapter = null;
    
    const imgHtml = character.imageLocal 
        ? `<div class="char-page-img-wrapper"><img src="${character.imageLocal}" alt="${character.name}"></div>`
        : `<div class="char-page-img-wrapper" style="background: var(--bg-hover); display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-size: 64px; color:var(--accent-light);">${character.name.split(' ').map(w=>w[0]).join('')}</div>`;
        
    if (els.characterPageContainer) {
        els.characterPageContainer.innerHTML = `
            ${imgHtml}
            <div class="char-page-info">
                <h2 class="char-page-name">${character.name}</h2>
                <div class="char-page-detail"><strong>Дата народження:</strong> ${character.birthDate}</div>
                <div class="char-page-detail"><strong>Вік:</strong> ${character.age} років</div>
                <div class="char-page-detail"><strong>Тип особистості:</strong> <span class="mbti">${character.mbti}</span></div>
                <div style="margin-top: 24px;">
                    <p style="color: var(--text-muted); font-size: 14px; font-style: italic; line-height: 1.6;">
                        Детальна історія та психологічний портрет персонажа будуть розкриті під час прочитання історії...
                    </p>
                </div>
            </div>
        `;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openModal()  { els.modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
function closeModal() { els.modal.classList.remove('active'); document.body.style.overflow = ''; }

// ─── Sidebar ─────────────────────────────────
function openSidebar() {
    els.sidebar.classList.add('open');
    els.sidebarOverlay.classList.add('active');
    els.menuToggle.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeSidebar() {
    els.sidebar.classList.remove('open');
    els.sidebarOverlay.classList.remove('active');
    els.menuToggle.classList.remove('active');
    document.body.style.overflow = '';
}

function updateContinueBanner() {
    if (savedChapterNum && els.heroSection.style.display !== 'none') {
        const savedCh = allChapters.find(c => c.number === savedChapterNum);
        if (savedCh) {
            els.continueBanner.style.display = 'flex';
            els.continueChapterName.textContent = savedCh.title;
        }
    }
}

// ─── Hero Stats ──────────────────────────────
function renderHeroStats() {
    const published = allChapters.filter(c => c.status === 'published').length;
    const withAudio = allChapters.filter(c => c.audioUrl).length;
    els.heroStats.innerHTML = `
        <div class="hero-stat">
            <div class="hero-stat-value">${published}</div>
            <div class="hero-stat-label">Розділів</div>
        </div>
        <div class="hero-stat">
            <div class="hero-stat-value">${withAudio}</div>
            <div class="hero-stat-label">Озвучених</div>
        </div>
        <div class="hero-stat">
            <div class="hero-stat-value">4</div>
            <div class="hero-stat-label">Персонажі</div>
        </div>
    `;
    
    // Update banner since data is loaded now
    updateContinueBanner();
}

// ─── Events ──────────────────────────────────
function setupEventListeners() {
    // Mode Toggle
    if (els.modeToggleText) {
        els.modeToggleText.textContent = readMode === 'paged' ? 'По сторінках' : 'Скрол';
    }
    els.modeToggleBtn.addEventListener('click', () => {
        readMode = readMode === 'scroll' ? 'paged' : 'scroll';
        localStorage.setItem('readMode', readMode);
        if (els.modeToggleText) els.modeToggleText.textContent = readMode === 'paged' ? 'По сторінках' : 'Скрол';
        if (currentChapter) {
            renderChapterContent(currentChapter);
        }
    });

    // Paged Nav
    els.pagedPrevBtn.addEventListener('click', () => {
        if (currentPageIndex > 0) {
            currentPageIndex--;
            renderCurrentPage();
        }
    });
    els.pagedNextBtn.addEventListener('click', () => {
        if (currentPageIndex < pagedContentHTML.length - 1) {
            currentPageIndex++;
            renderCurrentPage();
        } else {
            // go to next chapter
            if (currentChapter) {
                const next = allChapters.find(c => c.number === currentChapter.number + 1);
                if (next && next.status !== 'in_progress') openChapter(next.number);
            }
        }
    });

    // Continue Banner
    els.continueBtn.addEventListener('click', () => {
        if (savedChapterNum) {
            openChapter(savedChapterNum);
        }
    });
    // Sidebar
    els.menuToggle.addEventListener('click', () => {
        els.sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });
    els.sidebarClose.addEventListener('click', closeSidebar);
    els.sidebarOverlay.addEventListener('click', closeSidebar);

    // Back to home
    els.backToHomeBtn.addEventListener('click', () => {
        showHero();
        closeSidebar();
    });

    if (els.characterBackBtn) {
        els.characterBackBtn.addEventListener('click', showHero);
    }

    // Start reading
    els.startReadingBtn.addEventListener('click', () => {
        if (allChapters.length > 0) {
            openChapter(1);
        }
    });

    // Chapter navigation
    els.prevBtn.addEventListener('click', () => {
        if (currentChapter && currentChapter.number > 1) {
            openChapter(currentChapter.number - 1);
        }
    });
    els.nextBtn.addEventListener('click', () => {
        if (currentChapter) {
            const next = allChapters.find(c => c.number === currentChapter.number + 1);
            if (next && next.status !== 'in_progress') {
                openChapter(next.number);
            }
        }
    });

    // Characters modal
    els.charactersBtn.addEventListener('click', () => { openModal(); closeSidebar(); });
    els.heroCharactersBtn.addEventListener('click', openModal);
    els.modalCloseBtn.addEventListener('click', closeModal);
    els.modal.addEventListener('click', e => { if (e.target === els.modal) closeModal(); });

    // Keyboard
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeModal();
            closeSidebar();
        }
        if (currentChapter) {
            if (readMode === 'paged' && els.pagedNav.style.display !== 'none') {
                if (e.key === 'ArrowLeft') els.pagedPrevBtn.click();
                if (e.key === 'ArrowRight') els.pagedNextBtn.click();
            } else {
                if (e.key === 'ArrowLeft') els.prevBtn.click();
                if (e.key === 'ArrowRight') els.nextBtn.click();
            }
        }
    });

    // Swipe to open sidebar on mobile
    let touchStartX = 0;
    let touchStartY = 0;
    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    document.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].screenX - touchStartX;
        const dy = Math.abs(e.changedTouches[0].screenY - touchStartY);
        if (dx > 80 && dy < 60 && touchStartX < 30) {
            openSidebar();
        }
        if (dx < -80 && dy < 60 && els.sidebar.classList.contains('open')) {
            closeSidebar();
        }
    }, { passive: true });
}
