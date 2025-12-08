document.addEventListener('DOMContentLoaded', () => {

    const contentArea = document.getElementById('app-content');
    const sidebarNav = document.getElementById('sidebar-nav');
    const searchInput = document.getElementById('searchInput');
    const loader = document.getElementById('loader');
    const toastContainer = document.getElementById('toast-container');
    
    // Boss Mode
    const bossScreen = document.getElementById('boss-screen');
    const exitBossBtn = document.getElementById('exit-boss');
    const bossFrame = document.getElementById('boss-frame');
    const faviconElement = document.getElementById('site-favicon');

    const CONFIG = {
        bossUrl: "https://saladofuturo.educacao.sp.gov.br",
        bossTitle: "Sala do Futuro",
        bossIcon: "https://edusp-static.ip.tv/sala-do-futuro/conteudo_logo.png",
        normalTitle: "Ninja Labs",
        normalIcon: "about:blank"
    };

    let DB = {};
    let state = {
        page: 'inicio',
        favorites: JSON.parse(localStorage.getItem('ninjaFavorites')) || [],
        tag: null
    };

    // --- TOAST NOTIFICATION SYSTEM ---
    const showToast = (message, icon = 'check-circle') => {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
        toastContainer.appendChild(toast);
        
        // Remove após 3 segundos
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // --- RENDERIZAÇÃO ---

    const renderSidebar = () => {
        const mainLinks = [
            { id: 'inicio', label: 'Início', icon: 'fa-home' },
            { id: 'favorites', label: 'Favoritos', icon: 'fa-heart' }
        ];

        const catLinks = [
            { id: 'pcGames', label: 'Jogos PC', icon: 'fa-desktop' },
            { id: 'browserGames', label: 'Web Games', icon: 'fa-globe' },
            { id: 'emulatorGames', label: 'Emuladores', icon: 'fa-gamepad' },
            { id: 'hacks', label: 'Scripts', icon: 'fa-code' },
            { id: 'tools', label: 'Ferramentas', icon: 'fa-toolbox' }
        ];

        const linkHTML = (l) => `
            <a href="#" data-page="${l.id}" class="nav-item ${state.page === l.id ? 'active' : ''}">
                <i class="fas ${l.icon}"></i> 
                <span>${l.label}</span>
            </a>`;

        sidebarNav.innerHTML = `
            ${mainLinks.map(linkHTML).join('')}
            <div class="menu-label">Explorar</div>
            ${catLinks.map(linkHTML).join('')}
        `;
    };

    const renderCard = (item) => {
        const isFav = state.favorites.includes(item.title);
        
        const tagsHTML = item.tags ? 
            `<div class="tags">${item.tags.map(t => `<span class="tag" data-tag="${t}">${t}</span>`).join('')}</div>` : '';

        let btnHTML = '';
        if(item.type === 'script') {
            btnHTML = `<button class="btn btn-primary copy-btn" data-val="${item.scriptContent}"><i class="fas fa-copy"></i> Copiar</button>`;
        } else {
            let link = item.downloadLink || item.gameUrl || item.accessLink || '#';
            if(item.rom) link = `player.html?core=${item.core}&rom=${encodeURIComponent('roms/' + item.rom)}`;
            
            btnHTML = `<a href="${link}" target="_blank" class="btn btn-primary">Abrir</a>`;
            if(item.alternativeLink) btnHTML += `<a href="${item.alternativeLink}" target="_blank" class="btn btn-secondary">Mirror</a>`;
        }

        return `
        <div class="card">
            <div class="card-header">
                <div class="card-icon"><i class="${item.icon || 'fas fa-cube'}"></i></div>
                <button class="fav-btn ${isFav ? 'active' : ''}" data-title="${item.title}" title="Favoritar">
                    <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
                </button>
            </div>
            <h3>${item.title}</h3>
            ${tagsHTML}
            <p>${item.description}</p>
            <div class="actions">${btnHTML}</div>
        </div>`;
    };

    const renderContent = () => {
        const titles = {
            inicio: 'Visão Geral', pcGames: 'Jogos de PC', browserGames: 'Jogos de Navegador',
            emulatorGames: 'Emuladores & ROMs', hacks: 'Scripts & Utilitários', tools: 'Ferramentas do Sistema',
            favorites: 'Seus Favoritos'
        };

        // HOME PAGE
        if (state.page === 'inicio') {
            const all = Object.values(DB).flat();
            const featured = all.filter(i => i.featured).map(renderCard).join('');
            
            contentArea.innerHTML = `
                <div class="hero">
                    <h1>Acesso Restrito</h1>
                    <p>Plataforma unificada para jogos, scripts de automação e ferramentas escolares. Sem bloqueios.</p>
                    <a href="#" data-page="pcGames" class="btn-cta">Começar a Explorar</a>
                </div>
                <h2 class="section-title"><i class="fas fa-fire" style="color:var(--brand)"></i> Em Destaque</h2>
                <div class="grid">${featured}</div>
            `;
            return;
        }

        // CATEGORIAS
        let items = [];
        if (state.page === 'favorites') {
            const all = Object.values(DB).flat();
            items = all.filter(i => state.favorites.includes(i.title));
        } else {
            items = DB[state.page] || [];
        }

        if (state.tag) {
            items = items.filter(i => i.tags && i.tags.includes(state.tag));
        }

        const filterHTML = state.tag ? 
            `<div class="filter-info"><div class="chip" id="clear-tag">Filtro: ${state.tag} <i class="fas fa-times"></i></div></div>` : '';

        // EMPTY STATES
        let contentHTML = '';
        if (items.length > 0) {
            contentHTML = `<div class="grid">${items.map(renderCard).join('')}</div>`;
        } else {
            if (state.page === 'favorites') {
                contentHTML = `
                    <div class="empty-state">
                        <i class="far fa-heart"></i>
                        <h3>Sem favoritos ainda</h3>
                        <p>Navegue pelas categorias e clique no coração para salvar seus itens preferidos aqui.</p>
                        <a href="#" data-page="pcGames" class="btn-cta" style="background:#333; color:#fff; border:1px solid #444">Explorar Agora</a>
                    </div>`;
            } else {
                contentHTML = `
                    <div class="empty-state">
                        <i class="fas fa-ghost"></i>
                        <h3>Nada encontrado</h3>
                        <p>Não encontramos nenhum item com esse nome ou filtro.</p>
                    </div>`;
            }
        }

        contentArea.innerHTML = `
            <h2 class="section-title">${titles[state.page] || state.page}</h2>
            ${filterHTML}
            ${contentHTML}
        `;
    };

    const render = () => {
        renderSidebar();
        renderContent();
    };

    // --- CORE LOGIC ---

    const loadDB = async () => {
        try {
            const res = await fetch(`data/db.json?v=${Date.now()}`);
            if(!res.ok) throw new Error("DB Error");
            DB = await res.json();
            
            const hash = window.location.hash.slice(1);
            if(hash && (DB[hash] || hash === 'favorites')) state.page = hash;

            render();
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
        } catch (e) {
            console.error(e);
            loader.innerHTML = '<p style="color:#fff; text-align:center">Erro ao carregar sistema.</p>';
        }
    };

    const toggleBoss = () => {
        const active = bossScreen.classList.contains('active');
        if(!active) {
            if(!bossFrame.src) bossFrame.src = CONFIG.bossUrl;
            bossScreen.classList.add('active');
            document.title = CONFIG.bossTitle;
            if(faviconElement) faviconElement.href = CONFIG.bossIcon;
        } else {
            bossScreen.classList.remove('active');
            document.title = CONFIG.normalTitle;
            if(faviconElement) faviconElement.href = CONFIG.normalIcon;
        }
    };

    // --- EVENT LISTENERS ---

    document.addEventListener('click', (e) => {
        // NAV
        const nav = e.target.closest('[data-page]');
        if(nav) {
            e.preventDefault();
            state.page = nav.dataset.page;
            state.tag = null;
            render();
            contentArea.scrollTop = 0; // Scroll content to top
            
            // Mobile: Close menu click (Optional implementation)
        }

        // TAGS
        const tag = e.target.closest('[data-tag]');
        if(tag) {
            state.tag = tag.dataset.tag;
            render();
        }
        if(e.target.closest('#clear-tag')) {
            state.tag = null;
            render();
        }

        // FAVORITOS
        const fav = e.target.closest('.fav-btn');
        if(fav) {
            const title = fav.dataset.title;
            const idx = state.favorites.indexOf(title);
            
            if(idx === -1) {
                state.favorites.push(title);
                fav.classList.add('active');
                fav.innerHTML = '<i class="fas fa-heart"></i>';
                showToast(`"${title}" adicionado aos favoritos!`);
            } else {
                state.favorites.splice(idx, 1);
                fav.classList.remove('active');
                fav.innerHTML = '<i class="far fa-heart"></i>';
                showToast(`"${title}" removido.`, 'trash');
            }
            localStorage.setItem('ninjaFavorites', JSON.stringify(state.favorites));
            
            // Se estiver na tela de favoritos, remove o card visualmente
            if(state.page === 'favorites') {
                const card = fav.closest('.card');
                if(card) {
                    card.style.transition = 'all 0.3s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.9)';
                    setTimeout(() => render(), 300);
                }
            }
        }

        // COPIAR SCRIPT
        const copy = e.target.closest('.copy-btn');
        if(copy) {
            navigator.clipboard.writeText(copy.dataset.val);
            showToast('Script copiado para a área de transferência!');
        }

        // BOSS & EXIT
        if(e.target.closest('#boss-btn') || e.target.closest('#exit-boss')) toggleBoss();
    });

    // BUSCA
    searchInput.addEventListener('keyup', (e) => {
        const val = e.target.value.toLowerCase();
        
        // Atalho Teclado "/"
        if(e.key === '/' && document.activeElement !== searchInput) {
            searchInput.focus();
            e.preventDefault();
            return;
        }

        // Se vazio, volta ao normal
        if(val === '') {
            if(state.page === 'search') {
                state.page = 'inicio';
                render();
            }
            return;
        }

        // Busca Global
        const allItems = Object.values(DB).flat();
        const filtered = allItems.filter(item => item.title.toLowerCase().includes(val));

        // Renderização Manual da Busca
        let html = '';
        if(filtered.length > 0) {
            html = `<div class="grid">${filtered.map(renderCard).join('')}</div>`;
        } else {
            html = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>Nenhum resultado</h3>
                    <p>Não encontramos nada com "${val}".</p>
                </div>`;
        }

        contentArea.innerHTML = `
            <h2 class="section-title">Resultados da Busca</h2>
            ${html}
        `;
    });

    // ATALHO "/" PARA BUSCA
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            searchInput.focus();
        }
        if (e.key === '\\' || e.key === 'Insert' || e.key === 'Escape') {
            if(bossScreen.classList.contains('active') && e.key === 'Escape') toggleBoss();
            if(e.key === '\\' || e.key === 'Insert') toggleBoss();
        }
    });

    loadDB();
});
