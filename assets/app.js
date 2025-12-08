document.addEventListener('DOMContentLoaded', () => {

    // ELEMENTOS
    const contentArea = document.getElementById('content-area');
    const sidebarMenu = document.getElementById('sidebar-menu');
    const searchInput = document.getElementById('searchInput');
    const loader = document.getElementById('loader');
    const toastContainer = document.getElementById('toast-container');
    
    // BOSS MODE
    const bossScreen = document.getElementById('boss-screen');
    const bossExit = document.getElementById('boss-exit-area');
    const bossFrame = document.getElementById('boss-frame');
    const favicon = document.getElementById('site-favicon');

    // CONFIG
    const CONFIG = {
        bossUrl: "https://saladofuturo.educacao.sp.gov.br",
        bossTitle: "Sala do Futuro",
        bossIcon: "https://edusp-static.ip.tv/sala-do-futuro/conteudo_logo.png",
        normalTitle: "Ninja Labs",
        normalIcon: "about:blank"
    };

    let DB = {};
    let state = { page: 'inicio', favorites: JSON.parse(localStorage.getItem('ninjaFavorites')) || [] };

    // --- FUNÇÕES DE INTERFACE ---

    const showToast = (msg) => {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerText = msg;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };

    const renderSidebar = () => {
        const links = [
            { id: 'inicio', icon: 'fa-home', label: 'Início' },
            { id: 'favorites', icon: 'fa-heart', label: 'Favoritos' },
            { type: 'sep', label: 'Categorias' },
            { id: 'pcGames', icon: 'fa-desktop', label: 'Jogos PC' },
            { id: 'browserGames', icon: 'fa-globe', label: 'Web Games' },
            { id: 'emulatorGames', icon: 'fa-gamepad', label: 'Emuladores' },
            { id: 'hacks', icon: 'fa-code', label: 'Scripts' },
            { id: 'tools', icon: 'fa-toolbox', label: 'Ferramentas' }
        ];

        sidebarMenu.innerHTML = links.map(l => {
            if(l.type === 'sep') return `<div class="menu-label">${l.label}</div>`;
            return `
            <a href="#" data-page="${l.id}" class="nav-item ${state.page === l.id ? 'active' : ''}">
                <i class="fas ${l.icon}"></i> <span>${l.label}</span>
            </a>`;
        }).join('');
    };

    const renderCard = (item, idx) => {
        const isFav = state.favorites.includes(item.title);
        const tags = item.tags ? `<div class="tags">${item.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : '';
        const delay = idx * 50;

        let btn = '';
        if(item.type === 'script') {
            btn = `<button class="btn btn-primary copy-btn" data-val="${item.scriptContent}">Copiar Script</button>`;
        } else {
            let link = item.downloadLink || item.gameUrl || item.accessLink || '#';
            if(item.rom) link = `player.html?core=${item.core}&rom=${encodeURIComponent('roms/' + item.rom)}`;
            btn = `<a href="${link}" target="_blank" class="btn btn-primary">Acessar</a>`;
            if(item.alternativeLink) btn += `<a href="${item.alternativeLink}" target="_blank" class="btn btn-sec">Mirror</a>`;
        }

        return `
        <div class="card" style="animation-delay: ${delay}ms">
            <div class="card-header">
                <div class="card-icon"><i class="${item.icon || 'fas fa-cube'}"></i></div>
                <button class="fav-btn ${isFav ? 'active' : ''}" data-title="${item.title}">
                    <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
                </button>
            </div>
            <h3>${item.title}</h3>
            ${tags}
            <p>${item.description}</p>
            <div class="actions">${btn}</div>
        </div>`;
    };

    const renderContent = () => {
        const titles = { inicio: 'Visão Geral', favorites: 'Seus Favoritos', pcGames: 'Jogos PC', browserGames: 'Jogos Navegador', emulatorGames: 'Emuladores', hacks: 'Hacks', tools: 'Ferramentas' };
        
        // HOME
        if(state.page === 'inicio') {
            const all = Object.values(DB).flat();
            const featured = all.filter(i => i.featured).map(renderCard).join('');
            contentArea.innerHTML = `
                <div class="hero">
                    <h1>Acesso Restrito</h1>
                    <p>Hub unificado para jogos e ferramentas escolares.</p>
                    <a href="#" data-page="pcGames" class="btn-cta">Explorar</a>
                </div>
                <h2 class="section-title"><i class="fas fa-fire" style="color:var(--accent)"></i> Em Destaque</h2>
                <div class="grid">${featured}</div>
            `;
            return;
        }

        // CATEGORIAS
        let items = [];
        if(state.page === 'favorites') {
            const all = Object.values(DB).flat();
            items = all.filter(i => state.favorites.includes(i.title));
        } else {
            items = DB[state.page] || [];
        }

        let html = items.length ? `<div class="grid">${items.map(renderCard).join('')}</div>` : 
            `<div class="empty-state"><i class="fas fa-ghost"></i><h3>Nada aqui.</h3></div>`;

        contentArea.innerHTML = `<h2 class="section-title">${titles[state.page] || state.page}</h2>${html}`;
    };

    const render = () => {
        renderSidebar();
        renderContent();
    };

    // --- LÓGICA ---

    const loadDB = async () => {
        try {
            const res = await fetch(`data/db.json?v=${Date.now()}`);
            if(!res.ok) throw new Error("DB Error");
            DB = await res.json();
            
            // Verifica hash
            const hash = window.location.hash.slice(1);
            if(hash && (DB[hash] || hash === 'favorites')) state.page = hash;

            render();
            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => loader.style.display = 'none', 500);
            }, 500);
        } catch (e) {
            console.error(e);
            loader.innerHTML = '<p style="color:#fff">Erro ao carregar dados.</p>';
        }
    };

    const toggleBoss = () => {
        const active = bossScreen.classList.contains('active');
        if(!active) {
            if(!bossFrame.src || bossFrame.src === 'about:blank') bossFrame.src = CONFIG.bossUrl;
            bossScreen.classList.add('active');
            document.title = CONFIG.bossTitle;
            if(favicon) favicon.href = CONFIG.bossIcon;
        } else {
            bossScreen.classList.remove('active');
            document.title = CONFIG.normalTitle;
            if(favicon) favicon.href = CONFIG.normalIcon;
        }
    };

    // --- EVENTOS ---

    document.addEventListener('click', (e) => {
        // NAV
        const nav = e.target.closest('[data-page]');
        if(nav) {
            e.preventDefault();
            state.page = nav.dataset.page;
            render();
            contentArea.scrollTop = 0;
        }

        // FAVORITAR
        const fav = e.target.closest('.fav-btn');
        if(fav) {
            const title = fav.dataset.title;
            const idx = state.favorites.indexOf(title);
            if(idx === -1) {
                state.favorites.push(title);
                fav.classList.add('active');
                fav.innerHTML = '<i class="fas fa-heart"></i>';
                showToast('Adicionado aos favoritos');
            } else {
                state.favorites.splice(idx, 1);
                fav.classList.remove('active');
                fav.innerHTML = '<i class="far fa-heart"></i>';
                showToast('Removido');
            }
            localStorage.setItem('ninjaFavorites', JSON.stringify(state.favorites));
            if(state.page === 'favorites') render(); // Refresh na tela de favoritos
        }

        // COPIAR
        const copy = e.target.closest('.copy-btn');
        if(copy) {
            navigator.clipboard.writeText(copy.dataset.val);
            showToast('Copiado para área de transferência');
        }

        // BOSS
        if(e.target.closest('#boss-btn') || e.target.closest('#boss-exit-area')) toggleBoss();
    });

    // BUSCA
    searchInput.addEventListener('keyup', (e) => {
        const val = e.target.value.toLowerCase();
        if(val === '') { if(state.page === 'search') { state.page = 'inicio'; render(); } return; }

        const all = Object.values(DB).flat();
        const filtered = all.filter(i => i.title.toLowerCase().includes(val));
        const html = filtered.length ? `<div class="grid">${filtered.map(renderCard).join('')}</div>` : `<div class="empty-state"><i class="fas fa-search"></i><h3>Sem resultados</h3></div>`;
        contentArea.innerHTML = `<h2 class="section-title">Busca: "${val}"</h2>${html}`;
    });

    // ATALHOS
    document.addEventListener('keydown', (e) => {
        if(e.key === '\\' || e.key === 'Insert' || (bossScreen.classList.contains('active') && e.key === 'Escape')) toggleBoss();
        if(e.key === '/' && document.activeElement !== searchInput) {
            e.preventDefault(); searchInput.focus();
        }
    });

    loadDB();
});
