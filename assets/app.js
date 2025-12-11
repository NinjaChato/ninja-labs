document.addEventListener('DOMContentLoaded', () => {

    const contentArea = document.getElementById('app-content');
    const sidebarNav = document.getElementById('sidebar-nav');
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearch');
    const loader = document.getElementById('loader');
    const loaderText = document.getElementById('loader-text');
    const toastContainer = document.getElementById('toast-container');
    
    // Boss Mode
    const bossScreen = document.getElementById('boss-screen');
    const bossExit = document.getElementById('boss-exit-visible');
    const bossFrame = document.getElementById('boss-frame');
    const favicon = document.getElementById('site-favicon');

    const CONFIG = {
        bossUrl: "https://saladofuturo.educacao.sp.gov.br",
        bossTitle: "Sala do Futuro",
        bossIcon: "https://edusp-static.ip.tv/sala-do-futuro/conteudo_logo.png",
        normalTitle: "NINJA LABS // ACESSO",
        normalIcon: "about:blank"
    };

    let DB = {};
    let state = {
        page: 'inicio',
        favorites: JSON.parse(localStorage.getItem('ninjaFavorites')) || [],
        tag: null
    };

    // --- LOADER EFFECT ---
    // Simula decodificação de texto
    const decodeText = (target, text) => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let iterations = 0;
        const interval = setInterval(() => {
            target.innerText = text.split("").map((letter, index) => {
                if(index < iterations) return text[index];
                return chars[Math.floor(Math.random() * 36)];
            }).join("");
            if(iterations >= text.length) clearInterval(interval);
            iterations += 1/3;
        }, 30);
    };

    // --- RIPPLE EFFECT ---
    const createRipple = (event) => {
        const button = event.currentTarget;
        const circle = document.createElement("span");
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
        circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
        circle.classList.add("ripple-effect");

        const ripple = button.getElementsByClassName("ripple-effect")[0];
        if (ripple) ripple.remove();

        button.appendChild(circle);
    };

    // --- SPOTLIGHT EFFECT ---
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
            <div class="menu-category">PRINCIPAL</div>
            <a href="#" data-page="inicio" class="nav-item ripple ${state.page === 'inicio' ? 'active' : ''}">
                <i class="fas fa-home"></i> <span>Início</span>
            </a>
            <a href="#" data-page="favorites" class="nav-item ripple ${state.page === 'favorites' ? 'active' : ''}">
                <i class="fas fa-heart"></i> <span>Favoritos</span>
            </a>
            
            <div class="menu-category">BANCO DE DADOS</div>
            <a href="#" data-page="pcGames" class="nav-item ripple ${state.page === 'pcGames' ? 'active' : ''}">
                <i class="fas fa-desktop"></i> <span>Jogos PC</span>
            </a>
            <a href="#" data-page="browserGames" class="nav-item ripple ${state.page === 'browserGames' ? 'active' : ''}">
                <i class="fas fa-globe"></i> <span>Web Games</span>
            </a>
            <a href="#" data-page="emulatorGames" class="nav-item ripple ${state.page === 'emulatorGames' ? 'active' : ''}">
                <i class="fas fa-gamepad"></i> <span>Emuladores</span>
            </a>
            
            <div class="menu-category">UTILITÁRIOS</div>
            <a href="#" data-page="hacks" class="nav-item ripple ${state.page === 'hacks' ? 'active' : ''}">
                <i class="fas fa-code"></i> <span>Scripts</span>
            </a>
            <a href="#" data-page="tools" class="nav-item ripple ${state.page === 'tools' ? 'active' : ''}">
                <i class="fas fa-toolbox"></i> <span>Ferramentas</span>
            </a>
        `;
        sidebarNav.innerHTML = menuHTML;
        
        // Re-attach ripple events
        document.querySelectorAll('.ripple').forEach(btn => btn.addEventListener('click', createRipple));
    };

    const renderCard = (item, index) => {
        const isFav = state.favorites.includes(item.title);
        const tags = item.tags ? `<div class="tags">${item.tags.map(t => `<span class="tag" data-tag="${t}">${t}</span>`).join('')}</div>` : '';
        const delay = Math.min(index * 50, 800);

        let btn = '';
        if(item.type === 'script') {
            btn = `<button class="action-btn btn-solid copy-btn ripple" data-val="${item.scriptContent}"><i class="fas fa-copy"></i> COPIAR</button>`;
        } else {
            let link = item.downloadLink || item.gameUrl || item.accessLink || '#';
            if(item.rom) link = `player.html?core=${item.core}&rom=${encodeURIComponent('roms/' + item.rom)}`;
            btn = `<a href="${link}" target="_blank" class="action-btn btn-solid ripple">ACESSAR</a>`;
            if(item.alternativeLink) btn += `<a href="${item.alternativeLink}" target="_blank" class="action-btn btn-outline ripple">MIRROR</a>`;
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
        const titles = { 
            inicio: 'DASHBOARD', favorites: 'FAVORITOS', pcGames: 'JOGOS PC', 
            browserGames: 'WEB GAMES', emulatorGames: 'EMULAÇÃO', hacks: 'SCRIPTS', tools: 'FERRAMENTAS' 
        };
        
        // HOME PAGE
        if (state.page === 'inicio') {
            const all = Object.values(DB).flat();
            const featured = all.filter(i => i.featured).map(renderCard).join('');
            
            contentArea.innerHTML = `
                <div class="hero-wrapper">
                    <div class="hero-content">
                        <h1 class="hero-title">ACESSO RESTRITO</h1>
                        <p class="hero-subtitle">Plataforma centralizada. Jogos desbloqueados, automação e ferramentas sem restrições.</p>
                        <a href="#" data-page="pcGames" class="hero-btn ripple">EXPLORAR SISTEMA</a>
                    </div>
                </div>
                <div class="section-header">
                    <h2 class="section-title"><i class="fas fa-star" style="color:var(--accent-cyan); font-size:1.2rem"></i> DESTAQUES</h2>
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

        const filterHTML = state.tag ? `<div class="filter-info"><div class="chip" id="clear-tag">FILTRO: ${state.tag} <i class="fas fa-times"></i></div></div>` : '';

        let contentHTML = '';
        if (items.length > 0) {
            contentHTML = `<div class="grid">${items.map(renderCard).join('')}</div>`;
        } else {
            const msg = state.page === 'favorites' ? 'Nenhum item salvo.' : 'Nada encontrado.';
            contentHTML = `<div class="empty-state"><i class="fas fa-ghost"></i><h3>VAZIO</h3><p>${msg}</p></div>`;
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
            decodeText(loaderText, "CARREGANDO SISTEMA...");
            const res = await fetch(`data/db.json?v=${Date.now()}`);
            if(!res.ok) throw new Error("Connection Refused");
            DB = await res.json();
            
            const hash = window.location.hash.slice(1);
            if(hash && (DB[hash] || hash === 'favorites')) state.page = hash;

            render();
            
            // Loader Out
            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => loader.style.display = 'none', 800);
            }, 1000); 
        } catch (e) {
            console.error(e);
            loader.innerHTML = '<div style="color:red; font-family:monospace">FALHA CRÍTICA: ERRO NO BANCO DE DADOS</div>';
        }
    };

    const toggleBoss = () => {
        const active = bossScreen.classList.contains('active');
        if(!active) {
            if(!bossFrame.src || bossFrame.src === 'about:blank') {
                bossFrame.src = CONFIG.bossUrl;
                bossFrame.onload = () => bossFrame.classList.add('loaded'); 
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

    // --- LISTENERS ---
    document.addEventListener('click', (e) => {
        // NAV
        const nav = e.target.closest('[data-page]');
        if(nav) {
            e.preventDefault();
            state.page = nav.dataset.page;
            state.tag = null;
            render();
            contentArea.scrollTop = 0;
            createRipple(e);
        }

        // TAGS
        const tag = e.target.closest('[data-tag]');
        if(tag) { state.tag = tag.dataset.tag; render(); }
        if(e.target.closest('#clear-tag')) { state.tag = null; render(); }

        // FAVORITAR
        const fav = e.target.closest('.fav-btn');
        if(fav) {
            const title = fav.dataset.title;
            const idx = state.favorites.indexOf(title);
            if(idx === -1) {
                state.favorites.push(title);
                fav.classList.add('active');
                fav.innerHTML = '<i class="fas fa-heart"></i>';
                showToast('Salvo nos Favoritos');
            } else {
                state.favorites.splice(idx, 1);
                fav.classList.remove('active');
                fav.innerHTML = '<i class="far fa-heart"></i>';
                showToast('Removido dos Favoritos', 'trash');
            }
            localStorage.setItem('ninjaFavorites', JSON.stringify(state.favorites));
            if(state.page === 'favorites') {
                const card = fav.closest('.spotlight-card');
                if(card) { card.style.opacity='0'; setTimeout(()=> render(), 300); }
            }
        }

        // COPIAR
        const copy = e.target.closest('.copy-btn');
        if(copy) {
            createRipple(e);
            navigator.clipboard.writeText(copy.dataset.val);
            showToast('Código copiado!');
        }

        // LOGO HOME
        if(e.target.closest('#go-home-btn')) {
            state.page = 'inicio';
            render();
        }

        // BOSS
        if(e.target.closest('#boss-btn') || e.target.closest('#boss-exit-visible')) toggleBoss();
        
        // SEARCH CLEAR
        if(e.target.closest('#clearSearch')) {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            if(state.page === 'search') { state.page = 'inicio'; render(); }
            searchInput.focus();
        }
    });

    searchInput.addEventListener('keyup', (e) => {
        const val = e.target.value.toLowerCase();
        
        // Botão X toggle
        clearBtn.style.display = val.length > 0 ? 'block' : 'none';

        if(e.key === '/' && document.activeElement !== searchInput) { searchInput.focus(); e.preventDefault(); return; }
        if(val === '') { if(state.page === 'search') { state.page = 'inicio'; render(); } return; }

        const all = Object.values(DB).flat();
        const filtered = all.filter(i => i.title.toLowerCase().includes(val));
        const html = filtered.length ? `<div class="grid">${filtered.map(renderCard).join('')}</div>` : `<div class="empty-state"><i class="fas fa-search"></i><h3>NADA ENCONTRADO</h3></div>`;
        contentArea.innerHTML = `<div class="section-header"><h2 class="section-title">BUSCA: "${val}"</h2></div>${html}`;
        initSpotlight();
    });

    document.addEventListener('keydown', (e) => {
        if(e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); searchInput.focus(); }
        if(e.key === '\\' || e.key === 'Insert' || (bossScreen.classList.contains('active') && e.key === 'Escape')) toggleBoss();
    });

    loadDB();
});
