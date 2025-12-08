document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS DOM ---
    const appContainer = document.getElementById('app-container');
    const loader = document.getElementById('loader');
    const backToTopBtn = document.getElementById('back-to-top');
    
    // Boss Key Elements
    const bossScreen = document.getElementById('boss-screen');
    const exitBossBtn = document.getElementById('exit-boss');
    const bossFrame = document.getElementById('boss-frame');
    const faviconElement = document.getElementById('site-favicon');

    // Configurações Globais
    const CONFIG = {
        bossUrl: "https://saladofuturo.educacao.sp.gov.br",
        bossTitle: "Sala do Futuro Aluno",
        bossIcon: "https://edusp-static.ip.tv/sala-do-futuro/conteudo_logo.png",
        normalTitle: "Ninja Labs",
        normalIcon: "about:blank" // Ícone padrão vazio ou coloque o link do seu ícone
    };
    
    // Estado da Aplicação
    let DB = {};
    let state = {
        currentPage: 'inicio',
        favorites: JSON.parse(localStorage.getItem('ninjaFavorites')) || [],
        activeTag: null
    };

    // --- SISTEMA DE NAVEGAÇÃO E RENDERIZAÇÃO ---

    const templates = {
        header: () => {
            const links = [
                { id: 'inicio', label: 'Início', icon: 'fa-home' },
                { id: 'pcGames', label: 'Jogos PC', icon: 'fa-desktop' },
                { id: 'browserGames', label: 'Navegador', icon: 'fa-globe' },
                { id: 'emulatorGames', label: 'Emulador', icon: 'fa-gamepad' },
                { id: 'hacks', label: 'Hacks', icon: 'fa-user-secret' },
                { id: 'favorites', label: 'Favoritos', icon: 'fa-heart' },
                { id: 'tools', label: 'Ferramentas', icon: 'fa-wrench' }
            ];

            const navHTML = links.map(l => 
                `<a href="#${l.id}" data-page="${l.id}" class="nav-item ${state.currentPage === l.id ? 'active' : ''}">
                    <i class="fas ${l.icon}"></i> ${l.label}
                </a>`
            ).join('');

            return `
            <header class="site-header">
                <div class="header-top">
                    <div class="brand">
                        <h1 class="site-title">NINJA<span>LABS</span></h1>
                        <p class="site-description">Hub de Acesso Restrito v2.0</p>
                    </div>
                    <div class="header-actions">
                        <button id="boss-btn" class="icon-btn boss" title="Modo Pânico (\)">
                            <i class="fas fa-briefcase"></i>
                        </button>
                        <a href="https://discord.gg/ATS3E9ZeR7" target="_blank" class="icon-btn discord" title="Discord">
                            <i class="fab fa-discord"></i>
                        </a>
                    </div>
                </div>
                
                <div class="header-nav">
                    <div class="search-container">
                        <i class="fas fa-search"></i>
                        <input type="text" id="searchInput" class="search-input" placeholder="Buscar jogos, ferramentas..." autocomplete="off">
                    </div>
                    <nav class="nav-scroll">
                        ${navHTML}
                    </nav>
                </div>
            </header>`;
        },

        card: (item, index) => {
            const isFav = state.favorites.includes(item.title);
            const delay = index * 50; // Stagger animation

            // Gera Tags
            const tagsHTML = item.tags ? 
                `<div class="tags">${item.tags.map(t => `<span class="tag" data-tag="${t}">${t}</span>`).join('')}</div>` : '';

            // Gera Botões de Ação
            let actionsHTML = '';
            if (item.type === 'script') {
                actionsHTML = `<button class="btn btn-primary copy-script-btn" data-script="${item.scriptContent}"><i class="fas fa-copy"></i> Copiar Script</button>`;
            } else if (item.downloadLink && item.alternativeLink) {
                actionsHTML = `
                    <a href="${item.downloadLink}" target="_blank" class="btn btn-primary"><i class="fas fa-download"></i> Baixar</a>
                    <a href="${item.alternativeLink}" target="_blank" class="btn btn-sec">Mirror</a>`;
            } else {
                let link = item.downloadLink || item.accessLink || item.gameUrl || '#';
                if (item.rom) link = `player.html?core=${item.core}&rom=${encodeURIComponent('roms/' + item.rom)}`;
                actionsHTML = `<a href="${link}" target="_blank" class="btn btn-primary"><i class="fas fa-play"></i> Acessar</a>`;
            }

            return `
            <div class="card" style="animation-delay: ${delay}ms">
                <div class="card-top">
                    <div class="card-icon"><i class="${item.icon || 'fas fa-cube'}"></i></div>
                    <button class="fav-btn ${isFav ? 'active' : ''}" data-title="${item.title}">
                        <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                </div>
                <div class="card-content">
                    <h3>${item.title}</h3>
                    ${tagsHTML}
                    <p>${item.description}</p>
                    <div class="card-actions">${actionsHTML}</div>
                </div>
            </div>`;
        },

        home: () => {
            const all = Object.values(DB).flat();
            const featured = all.filter(i => i.featured);
            const cards = featured.map((item, i) => templates.card(item, i)).join('');
            
            return `
            <div class="fade-in">
                <section class="hero">
                    <h2>Acesso direto ao <br>essencial.</h2>
                    <p>Sem bloqueios. Sem rastreamento. Apenas o que você precisa.</p>
                    <a href="#pcGames" data-page="pcGames" class="cta-btn">Explorar Conteúdo <i class="fas fa-arrow-right"></i></a>
                </section>
                <div class="section-header">
                    <span class="section-title">Em Destaque</span>
                </div>
                <div class="grid">${cards}</div>
            </div>`;
        },

        category: (key, title) => {
            let items = [];
            if (key === 'favorites') {
                const all = Object.values(DB).flat();
                items = all.filter(i => state.favorites.includes(i.title));
            } else {
                items = DB[key] || [];
            }

            // Filtro de Tag
            if (state.activeTag) {
                items = items.filter(i => i.tags && i.tags.includes(state.activeTag));
            }

            // Créditos Específicos
            let credits = '';
            if (key === 'pcGames') credits = `<div class="section-credits">Fontes: <a href="https://steamrip.com" target="_blank">SteamRIP</a> & <a href="#" target="_blank">ChemicalFl00d</a></div>`;

            // Filtro UI
            const filterUI = state.activeTag ? 
                `<div class="filter-bar"><div class="active-tag" id="clear-filter">Tag: ${state.activeTag} <i class="fas fa-times"></i></div></div>` : '';

            // Mensagem Vazia
            if (items.length === 0) {
                return `
                <div class="fade-in">
                    <div class="section-header"><span class="section-title">${title}</span></div>
                    ${filterUI}
                    <div class="no-results" style="display:block"><i class="fas fa-ghost"></i><p>Nada encontrado aqui.</p></div>
                </div>`;
            }

            const cards = items.map((item, i) => templates.card(item, i)).join('');
            return `
            <div class="fade-in">
                <div class="section-header">
                    <span class="section-title">${title}</span>
                    ${credits}
                </div>
                ${filterUI}
                <div class="grid">${cards}</div>
                <div class="no-results"><i class="fas fa-search"></i><p>Nenhum resultado para a busca.</p></div>
            </div>`;
        }
    };

    // --- LÓGICA DO APP ---

    const render = () => {
        const titles = {
            inicio: 'Início', pcGames: 'Jogos PC', browserGames: 'Jogos Navegador',
            emulatorGames: 'Emuladores', hacks: 'Hacks & Scripts',
            tools: 'Ferramentas', favorites: 'Meus Favoritos'
        };

        const content = state.currentPage === 'inicio' 
            ? templates.home() 
            : templates.category(state.currentPage, titles[state.currentPage] || 'Categoria');

        appContainer.innerHTML = `
            <div class="app-wrapper">
                ${templates.header()}
                ${content}
                <footer class="footer">Ninja Labs &copy; 2024</footer>
            </div>
        `;

        // Reatribuir eventos de busca e scroll
        setupSearch();
        window.scrollTo(0,0);
    };

    const setupSearch = () => {
        const input = document.getElementById('searchInput');
        if (!input) return;

        input.addEventListener('keyup', (e) => {
            const term = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.grid .card');
            const noRes = document.querySelector('.no-results');
            let hasResult = false;

            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                if (text.includes(term)) {
                    card.style.display = 'flex';
                    hasResult = true;
                } else {
                    card.style.display = 'none';
                }
            });

            if(noRes) noRes.style.display = hasResult ? 'none' : 'block';
        });
    };

    // --- FUNÇÕES DE AÇÃO ---

    const toggleFavoriteLogic = (title) => {
        const idx = state.favorites.indexOf(title);
        if (idx === -1) state.favorites.push(title);
        else state.favorites.splice(idx, 1);
        
        localStorage.setItem('ninjaFavorites', JSON.stringify(state.favorites));
        render(); // Re-render para atualizar ícones
    };

    const toggleBoss = () => {
        const isActive = bossScreen.classList.contains('active');
        if (!isActive) {
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

    // --- INICIALIZAÇÃO ---

    const init = async () => {
        try {
            // Fetch DB com cache busting
            const res = await fetch(`data/db.json?t=${new Date().getTime()}`);
            if (!res.ok) throw new Error("Erro HTTP");
            DB = await res.json();
            
            // Router Inicial
            const hash = window.location.hash.slice(1);
            if (hash && ['pcGames','browserGames','hacks','tools','favorites'].includes(hash)) {
                state.currentPage = hash;
            }

            render();
            
            // Esconde Loader
            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => loader.style.display = 'none', 400);
            }, 500);

        } catch (err) {
            console.error(err);
            loader.innerHTML = `<div class="loader-content"><p style="color:#ff4757">Erro ao carregar dados.<br>Verifique o arquivo db.json.</p></div>`;
        }

        // Event Listeners Globais
        document.addEventListener('click', (e) => {
            // Navegação
            const nav = e.target.closest('[data-page]');
            if (nav) {
                e.preventDefault();
                state.currentPage = nav.dataset.page;
                state.activeTag = null;
                render();
            }

            // Tags
            const tag = e.target.closest('[data-tag]');
            if (tag) {
                state.activeTag = tag.dataset.tag;
                render();
            }

            // Limpar Filtro
            if (e.target.closest('#clear-filter')) {
                state.activeTag = null;
                render();
            }

            // Favoritar
            const fav = e.target.closest('.fav-btn');
            if (fav) {
                toggleFavoriteLogic(fav.dataset.title);
            }

            // Copiar Script
            const copy = e.target.closest('.copy-script-btn');
            if (copy) {
                navigator.clipboard.writeText(copy.dataset.script);
                const original = copy.innerHTML;
                copy.innerHTML = `<i class="fas fa-check"></i> Copiado!`;
                setTimeout(() => copy.innerHTML = original, 2000);
            }

            // Boss Mode Btn
            if (e.target.closest('#boss-btn')) toggleBoss();
        });

        // Event Listeners Fixos
        exitBossBtn.addEventListener('click', toggleBoss);
        document.addEventListener('keydown', (e) => {
            if (e.key === '\\' || e.key === 'Insert') toggleBoss();
        });

        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) backToTopBtn.classList.add('visible');
            else backToTopBtn.classList.remove('visible');
        });

        backToTopBtn.addEventListener('click', () => window.scrollTo(0,0));
    };

    init();
});
