document.addEventListener('DOMContentLoaded', () => {

    const contentArea = document.getElementById('app-content');
    const sidebarNav = document.getElementById('sidebar-nav');
    const searchInput = document.getElementById('searchInput');
    const loader = document.getElementById('loader');
    const toastContainer = document.getElementById('toast-container');
    
    // Boss Mode
    const bossScreen = document.getElementById('boss-screen');
    const bossExit = document.getElementById('boss-exit-trigger');
    const bossFrame = document.getElementById('boss-frame');
    const favicon = document.getElementById('site-favicon');

    const CONFIG = {
        bossUrl: "https://saladofuturo.educacao.sp.gov.br",
        bossTitle: "Sala do Futuro",
        bossIcon: "https://edusp-static.ip.tv/sala-do-futuro/conteudo_logo.png",
        normalTitle: "NINJA LABS // ACCESS",
        normalIcon: "about:blank"
    };

    let DB = {};
    let state = {
        page: 'inicio',
        favorites: JSON.parse(localStorage.getItem('ninjaFavorites')) || [],
        tag: null
    };

    // --- SPOTLIGHT EFFECT LOGIC ---
    // Faz o brilho seguir o mouse nos cards
    const initSpotlight = () => {
        const cards = document.querySelectorAll('.spotlight-card');
        cards.forEach(card => {
            card.onmousemove = e => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--x', `${x}px`);
                card.style.setProperty('--y', `${y}px`);
            };
        });
    };

    // --- TOAST ---
    const showToast = (msg, icon = 'check-circle') => {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="fas fa-${icon}"></i> ${msg}`;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    };

    // --- RENDER ---
    const renderSidebar = () => {
        const menuHTML = `
            <div class="menu-category">MAIN</div>
            <a href="#" data-page="inicio" class="nav-item ${state.page === 'inicio' ? 'active' : ''}">
                <i class="fas fa-home"></i> <span>Início</span>
            </a>
            <a href="#" data-page="favorites" class="nav-item ${state.page === 'favorites' ? 'active' : ''}">
                <i class="fas fa-heart"></i> <span>Favoritos</span>
            </a>
            
            <div class="menu-category">DATABASE</div>
            <a href="#" data-page="pcGames" class="nav-item ${state.page === 'pcGames' ? 'active' : ''}">
                <i class="fas fa-desktop"></i> <span>Jogos PC</span>
            </a>
            <a href="#" data-page="browserGames" class="nav-item ${state.page === 'browserGames' ? 'active' : ''}">
                <i class="fas fa-globe"></i> <span>Web Games</span>
            </a>
            <a href="#" data-page="emulatorGames" class="nav-item ${state.page === 'emulatorGames' ? 'active' : ''}">
                <i class="fas fa-gamepad"></i> <span>Emuladores</span>
            </a>
            
            <div class="menu-category">TOOLS</div>
            <a href="#" data-page="hacks" class="nav-item ${state.page === 'hacks' ? 'active' : ''}">
                <i class="fas fa-code"></i> <span>Scripts</span>
            </a>
            <a href="#" data-page="tools" class="nav-item ${state.page === 'tools' ? 'active' : ''}">
                <i class="fas fa-toolbox"></i> <span>Ferramentas</span>
            </a>
        `;
        sidebarNav.innerHTML = menuHTML;
    };

    const renderCard = (item, index) => {
        const isFav = state.favorites.includes(item.title);
        const tags = item.tags ? `<div class="tags">${item.tags.map(t => `<span class="tag" data-tag="${t}">${t}</span>`).join('')}</div>` : '';
        const delay = Math.min(index * 50, 800);

        let btn = '';
        if(item.type === 'script') {
            btn = `<button class="action-btn btn-solid copy-btn" data-val="${item.scriptContent}"><i class="fas fa-copy"></i> Copiar</button>`;
        } else {
            let link = item.downloadLink || item.gameUrl || item.accessLink || '#';
            if(item.rom) link = `player.html?core=${item.core}&rom=${encodeURIComponent('roms/' + item.rom)}`;
            btn = `<a href="${link}" target="_blank" class="action-btn btn-solid">ABRIR</a>`;
            if(item.alternativeLink) btn += `<a href="${item.alternativeLink}" target="_blank" class="action-btn btn-outline">MIRROR</a>`;
        }

        return `
        <div class="spotlight-card" style="animation-delay: ${delay}ms">
            <div class="card-top">
                <div class="card-icon"><i class="${item.icon || 'fas fa-cube'}"></i></div>
                <button class="fav-btn ${isFav ? 'active' : ''}" data-title="${item.title}" title="Favoritar">
                    <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
                </button>
            </div>
            <div class="card-content">
                <h3>${item.title}</h3>
                ${tags}
                <p>${item.description}</p>
            </div>
            <div class="card-actions">${btn}</div>
        </div>`;
    };

    const renderContent = () => {
        const titles = { inicio: 'DASHBOARD', favorites: 'FAVORITES', pcGames: 'PC GAMES', browserGames: 'WEB GAMES', emulatorGames: 'EMULATION', hacks: 'SCRIPTS', tools: 'TOOLS' };
        
        // HOME PAGE CINEMATOGRÁFICA
        if (state.page === 'inicio') {
            const all = Object.values(DB).flat();
            const featured = all.filter(i => i.featured).map(renderCard).join('');
            
            contentArea.innerHTML = `
                <div class="hero-wrapper fade-in-up">
                    <div class="hero-content">
                        <h1 class="hero-title">BEM-VINDO AO HUB</h1>
                        <p class="hero-subtitle">Plataforma centralizada de acesso restrito. Jogos, ferramentas e automação educacional sem bloqueios.</p>
                        <a href="#" data-page="pcGames" class="hero-btn">EXPLORAR SISTEMA</a>
                    </div>
                </div>
                <div class="section-header">
                    <h2 class="section-title"><i class="fas fa-star" style="color:var(--accent-cyan); font-size:1.2rem"></i> FEATURED</h2>
                </div>
                <div class="grid">${featured}</div>
            `;
            initSpotlight();
            return;
        }

        // LISTAGEM
        let items = [];
        if (state.page === 'favorites') {
            const all = Object.values(DB).flat();
            items = all.filter(i => state.favorites.includes(i.title));
        } else {
            items = DB[state.page] || [];
        }

        if (state.tag) items = items.filter(i => i.tags && i.tags.includes(state.tag));

        const filterHTML = state.tag ? `<div class="filter-info"><div class="chip" id="clear-tag">FILTER: ${state.tag} <i class="fas fa-times"></i></div></div>` : '';

        let contentHTML = '';
        if (items.length > 0) {
            contentHTML = `<div class="grid">${items.map(renderCard).join('')}</div>`;
        } else {
            const msg = state.page === 'favorites' ? 'Nenhum item salvo.' : 'Nada encontrado.';
            contentHTML = `<div class="empty-state"><i class="fas fa-ghost"></i><h3>VOID</h3><p>${msg}</p></div>`;
        }

        contentArea.innerHTML = `
            <div class="section-header">
                <h2 class="section-title">${titles[state.page] || state.page}</h2>
            </div>
            ${filterHTML}
            ${contentHTML}
        `;
        initSpotlight();
    };

    const render = () => {
        renderSidebar();
        renderContent();
    };

    // --- SYSTEM INIT ---
    const loadDB = async () => {
        try {
            const res = await fetch(`data/db.json?v=${Date.now()}`);
            if(!res.ok) throw new Error("Connection Refused");
            DB = await res.json();
            
            const hash = window.location.hash.slice(1);
            if(hash && (DB[hash] || hash === 'favorites')) state.page = hash;

            render();
            // Efeito de fade out do loader
            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => loader.style.display = 'none', 800);
            }, 1500); // Demora um pouco mais para apreciar o glitch effect
        } catch (e) {
            console.error(e);
            loader.innerHTML = '<div style="color:red; font-family:monospace">SYSTEM FAILURE: DATABASE_CONNECT_ERROR</div>';
        }
    };

    const toggleBoss = () => {
        const active = bossScreen.classList.contains('active');
        if(!active) {
            if(!bossFrame.src || bossFrame.src === 'about:blank') {
                bossFrame.src = CONFIG.bossUrl;
                bossFrame.onload = () => bossFrame.classList.add('loaded'); // Fade in quando carregar
            }
            bossScreen.classList.add('active');
            document.title = CONFIG.bossTitle;
            if(favicon) favicon.href = CONFIG.bossIcon;
        } else {
            bossScreen.classList.remove('active');
            document.title = CONFIG.normalTitle;
            if(favicon) favicon.href = CONFIG.normalIcon;
        }
    };

    // --- INPUTS ---
    document.addEventListener('click', (e) => {
        const nav = e.target.closest('[data-page]');
        if(nav) {
            e.preventDefault();
            state.page = nav.dataset.page;
            state.tag = null;
            render();
            contentArea.scrollTop = 0;
        }

        const tag = e.target.closest('[data-tag]');
        if(tag) { state.tag = tag.dataset.tag; render(); }
        if(e.target.closest('#clear-tag')) { state.tag = null; render(); }

        const fav = e.target.closest('.fav-btn');
        if(fav) {
            const title = fav.dataset.title;
            const idx = state.favorites.indexOf(title);
            if(idx === -1) {
                state.favorites.push(title);
                fav.classList.add('active');
                fav.innerHTML = '<i class="fas fa-heart"></i>';
                showToast('Saved to Database');
            } else {
                state.favorites.splice(idx, 1);
                fav.classList.remove('active');
                fav.innerHTML = '<i class="far fa-heart"></i>';
                showToast('Removed', 'trash');
            }
            localStorage.setItem('ninjaFavorites', JSON.stringify(state.favorites));
            if(state.page === 'favorites') {
                const card = fav.closest('.spotlight-card');
                if(card) { card.style.opacity='0'; setTimeout(()=> render(), 300); }
            }
        }

        const copy = e.target.closest('.copy-btn');
        if(copy) {
            navigator.clipboard.writeText(copy.dataset.val);
            showToast('Code Copied to Clipboard');
        }

        if(e.target.closest('#boss-btn') || e.target.closest('#boss-exit-trigger')) toggleBoss();
    });

    searchInput.addEventListener('keyup', (e) => {
        const val = e.target.value.toLowerCase();
        if(e.key === '/' && document.activeElement !== searchInput) { searchInput.focus(); e.preventDefault(); return; }
        if(val === '') { if(state.page === 'search') { state.page = 'inicio'; render(); } return; }

        const all = Object.values(DB).flat();
        const filtered = all.filter(i => i.title.toLowerCase().includes(val));
        const html = filtered.length ? `<div class="grid">${filtered.map(renderCard).join('')}</div>` : `<div class="empty-state"><i class="fas fa-search"></i><h3>NO_DATA</h3></div>`;
        contentArea.innerHTML = `<div class="section-header"><h2 class="section-title">SEARCH: "${val}"</h2></div>${html}`;
        initSpotlight();
    });

    document.addEventListener('keydown', (e) => {
        if(e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); searchInput.focus(); }
        if(e.key === '\\' || e.key === 'Insert' || (bossScreen.classList.contains('active') && e.key === 'Escape')) toggleBoss();
    });

    loadDB();
});
