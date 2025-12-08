document.addEventListener('DOMContentLoaded', () => {

    const contentArea = document.getElementById('app-content');
    const sidebarNav = document.getElementById('sidebar-nav');
    const searchInput = document.getElementById('searchInput');
    const loader = document.getElementById('loader');
    
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

    // --- RENDERIZAÇÃO ---

    const renderSidebar = () => {
        // MENU ORGANIZADO: Início e Favoritos no topo
        const mainLinks = [
            { id: 'inicio', label: 'Início', icon: 'fa-home' },
            { id: 'favorites', label: 'Meus Favoritos', icon: 'fa-heart' }
        ];

        const catLinks = [
            { id: 'pcGames', label: 'Jogos PC', icon: 'fa-desktop' },
            { id: 'browserGames', label: 'Navegador', icon: 'fa-globe' },
            { id: 'emulatorGames', label: 'Emulador', icon: 'fa-gamepad' },
            { id: 'hacks', label: 'Hacks', icon: 'fa-user-secret' },
            { id: 'tools', label: 'Ferramentas', icon: 'fa-wrench' }
        ];

        // Função auxiliar para gerar HTML do link
        const linkHTML = (l) => `
            <a href="#" data-page="${l.id}" class="nav-item ${state.page === l.id ? 'active' : ''}">
                <i class="fas ${l.icon}"></i> 
                <span>${l.label}</span>
            </a>`;

        sidebarNav.innerHTML = `
            ${mainLinks.map(linkHTML).join('')}
            <div class="menu-label">Categorias</div>
            ${catLinks.map(linkHTML).join('')}
        `;
    };

    const renderCard = (item) => {
        const isFav = state.favorites.includes(item.title);
        
        const tagsHTML = item.tags ? 
            `<div class="tags">${item.tags.map(t => `<span class="tag" data-tag="${t}">${t}</span>`).join('')}</div>` : '';

        let btnHTML = '';
        if(item.type === 'script') {
            btnHTML = `<button class="btn btn-primary copy-btn" data-val="${item.scriptContent}"><i class="fas fa-copy" style="margin-right:5px"></i> Copiar</button>`;
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
                <button class="fav-btn ${isFav ? 'active' : ''}" data-title="${item.title}">
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
            inicio: 'Hub Principal', pcGames: 'Jogos de PC', browserGames: 'Web Games',
            emulatorGames: 'Emuladores', hacks: 'Scripts & Hacks', tools: 'Ferramentas',
            favorites: 'Seus Favoritos'
        };

        // HOME PAGE
        if (state.page === 'inicio') {
            const all = Object.values(DB).flat();
            const featured = all.filter(i => i.featured).map(renderCard).join('');
            
            contentArea.innerHTML = `
                <div class="hero">
                    <h1>Acesso Restrito</h1>
                    <p>Hub unificado para jogos, scripts e ferramentas escolares.</p>
                    <a href="#" data-page="pcGames" class="btn-cta">Ver Jogos</a>
                </div>
                <h2 class="section-title"><i class="fas fa-fire" style="margin-right:10px; color:orange"></i> Destaques</h2>
                <div class="grid">${featured}</div>
            `;
            return;
        }

        // PREPARAÇÃO DE ITENS
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

        // --- EMPTY STATES (BONITINHOS) ---
        let contentHTML = '';

        if (items.length > 0) {
            contentHTML = `<div class="grid">${items.map(renderCard).join('')}</div>`;
        } else {
            // Se for favoritos vazio
            if (state.page === 'favorites') {
                contentHTML = `
                    <div class="empty-state">
                        <i class="far fa-heart"></i>
                        <h3>Você ainda não tem favoritos</h3>
                        <p>Navegue pelas categorias e clique no coração para salvar seus itens preferidos aqui.</p>
                        <a href="#" data-page="pcGames" class="btn-cta" style="background:#333; color:#fff; border:1px solid #444">Explorar Agora</a>
                    </div>`;
            } 
            // Se for busca/tag vazia
            else {
                contentHTML = `
                    <div class="empty-state">
                        <i class="fas fa-ghost"></i>
                        <h3>Nada encontrado</h3>
                        <p>Não encontramos nenhum item com esse nome ou filtro. Tente buscar por outra coisa.</p>
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

    // --- LÓGICA ---

    const loadDB = async () => {
        try {
            const res = await fetch(`data/db.json?v=${Date.now()}`);
            DB = await res.json();
            
            const hash = window.location.hash.slice(1);
            if(hash && DB[hash] || hash === 'favorites') state.page = hash;

            render();
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
        } catch (e) {
            console.error(e);
            loader.innerHTML = '<p style="color:red">Erro ao carregar dados.</p>';
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

    // --- EVENTOS ---

    document.addEventListener('click', (e) => {
        // Nav Links
        const nav = e.target.closest('[data-page]');
        if(nav) {
            e.preventDefault();
            state.page = nav.dataset.page;
            state.tag = null;
            render();
            // Em mobile, scroll para o topo do conteúdo, não da página
            const contentDiv = document.querySelector('.content-area');
            if(contentDiv) contentDiv.scrollTop = 0;
        }

        // Tags
        const tag = e.target.closest('[data-tag]');
        if(tag) {
            state.tag = tag.dataset.tag;
            render();
        }
        if(e.target.closest('#clear-tag')) {
            state.tag = null;
            render();
        }

        // Favoritar
        const fav = e.target.closest('.fav-btn');
        if(fav) {
            const title = fav.dataset.title;
            const idx = state.favorites.indexOf(title);
            
            if(idx === -1) {
                state.favorites.push(title);
                fav.classList.add('active');
                fav.innerHTML = '<i class="fas fa-heart"></i>';
            } else {
                state.favorites.splice(idx, 1);
                fav.classList.remove('active');
                fav.innerHTML = '<i class="far fa-heart"></i>';
            }
            localStorage.setItem('ninjaFavorites', JSON.stringify(state.favorites));
            
            // Remove visualmente se estiver na tela de favoritos
            if(state.page === 'favorites') {
                const card = fav.closest('.card');
                if(card) {
                    card.style.opacity = '0';
                    setTimeout(() => render(), 300); // Re-renderiza para mostrar o empty state se esvaziar
                }
            }
        }

        // Copiar
        const copy = e.target.closest('.copy-btn');
        if(copy) {
            navigator.clipboard.writeText(copy.dataset.val);
            const old = copy.innerHTML;
            copy.innerHTML = "Copiado!";
            setTimeout(()=> copy.innerHTML = old, 2000);
        }

        // Boss
        if(e.target.closest('#boss-btn') || e.target.closest('#exit-boss')) toggleBoss();
    });

    // Busca
    searchInput.addEventListener('keyup', (e) => {
        const val = e.target.value.toLowerCase();
        
        // Se a busca estiver vazia, restaura o estado normal
        if(val === '') {
            render();
            return;
        }

        // Busca em todo o DB
        const allItems = Object.values(DB).flat();
        const filtered = allItems.filter(item => item.title.toLowerCase().includes(val));

        // Renderiza resultado da busca manual
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

    // Atalhos
    document.addEventListener('keydown', (e) => {
        if(e.key === '\\' || e.key === 'Insert') toggleBoss();
    });

    loadDB();
});
