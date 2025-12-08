document.addEventListener('DOMContentLoaded', () => {

    const appContainer = document.getElementById('app-container');
    const loader = document.getElementById('loader');
    const backToTopBtn = document.getElementById('back-to-top');
    const bossScreen = document.getElementById('boss-screen');
    const exitBossBtn = document.getElementById('exit-boss');
    const bossFrame = document.getElementById('boss-frame');
    const faviconElement = document.getElementById('site-favicon'); // Referência ao ícone
    
    // Configurações do Boss Mode
    const BOSS_URL = "https://saladofuturo.educacao.sp.gov.br";
    const BOSS_TITLE = "Sala do Futuro Aluno";
    const BOSS_ICON = "https://edusp-static.ip.tv/sala-do-futuro/conteudo_logo.png";
    const NORMAL_TITLE = "Ninja Labs | Acesso Restrito";
    const NORMAL_ICON = "about:blank"; // Ou coloque o link do seu ícone original aqui

    let DB = {};
    
    let state = {
        currentPage: 'inicio',
        favorites: JSON.parse(localStorage.getItem('ninjaFavorites')) || [],
        activeTag: null
    };

    // --- FUNÇÕES DE FAVORITOS ---
    const toggleFavorite = (title, btnElement) => {
        const index = state.favorites.indexOf(title);
        let isAdding = false;

        if (index === -1) {
            state.favorites.push(title);
            isAdding = true;
        } else {
            state.favorites.splice(index, 1);
        }
        localStorage.setItem('ninjaFavorites', JSON.stringify(state.favorites));

        if (state.currentPage === 'favorites') {
            render();
        } else {
            if (isAdding) {
                btnElement.classList.add('active');
                btnElement.innerHTML = '<i class="fas fa-heart"></i>';
            } else {
                btnElement.classList.remove('active');
                btnElement.innerHTML = '<i class="far fa-heart"></i>';
            }
        }
    };

    // --- BOSS KEY LOGIC ---
    const toggleBossMode = () => {
        const isActive = bossScreen.classList.contains('active');
        
        if (!isActive) {
            // ATIVANDO MODO PÂNICO
            if(!bossFrame.src) bossFrame.src = BOSS_URL; // Carrega só na primeira vez
            bossScreen.classList.add('active');
            
            // Troca Título e Ícone
            document.title = BOSS_TITLE;
            if(faviconElement) faviconElement.href = BOSS_ICON;

        } else {
            // SAINDO DO MODO PÂNICO
            bossScreen.classList.remove('active');
            
            // Restaura Título e Ícone
            document.title = NORMAL_TITLE;
            if(faviconElement) faviconElement.href = NORMAL_ICON;
        }
    };

    // --- TAGS ---
    const createTagsHTML = (tags) => {
        if (!tags || tags.length === 0) return '';
        const tagsString = tags.map(tag => `<span class="tag" data-tag="${tag}">${tag}</span>`).join('');
        return `<div class="card-tags">${tagsString}</div>`;
    };

    // --- TEMPLATES ---

    const createHeader = () => {
        const categories = {
            'inicio': { label: 'Início', icon: 'fa-home' },
            'favorites': { label: 'Favoritos', icon: 'fa-star' },
            'pcGames': { label: 'Jogos PC', icon: 'fa-desktop' },
            'browserGames': { label: 'Navegador', icon: 'fa-globe' },
            'emulatorGames': { label: 'Emulador', icon: 'fa-ghost' },
            'hacks': { label: 'Hacks', icon: 'fa-user-secret' },
            'tools': { label: 'Ferramentas', icon: 'fa-tools' }
        };

        const navButtonsHTML = Object.keys(categories).map(key => {
            const cat = categories[key];
            const isActive = key === state.currentPage ? 'active' : '';
            return `<a href="#${key}" data-page="${key}" class="nav-btn ${isActive}">
                        <i class="fas ${cat.icon}"></i> ${cat.label}
                    </a>`;
        }).join('');

        return `
            <header class="site-header fade-in">
                <div class="header-top">
                    <div>
                        <h1 class="site-title">Ninja Labs</h1>
                        <p class="site-description">Acesso restrito, jogos e ferramentas.</p>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button id="boss-btn" class="boss-btn" title="Pânico (Tecla: \)">
                            <i class="fas fa-briefcase"></i>
                        </button>
                        <a href="https://discord.gg/ATS3E9ZeR7" target="_blank" rel="noopener noreferrer" class="discord-btn" title="Discord">
                            <i class="fab fa-discord"></i>
                        </a>
                    </div>
                </div>
                <div class="header-bottom">
                    <div class="search-wrapper">
                        <i class="fas fa-search"></i>
                        <input type="text" id="searchInput" class="search-input" placeholder="Buscar na página atual..." autocomplete="off">
                    </div>
                    <nav class="nav-buttons">${navButtonsHTML}</nav>
                </div>
            </header>
        `;
    };

    const createFooter = () => {
        return `
            <footer class="site-footer fade-in">
                <p>Ninja Labs &copy; 2024</p>
            </footer>
        `;
    };

    const createCard = (item, index = 0) => {
        const isFav = state.favorites.includes(item.title);
        const favIconClass = isFav ? 'fas fa-heart' : 'far fa-heart';
        const activeClass = isFav ? 'active' : '';

        let actionButtonsHTML = '';
        if (item.type === 'script') {
            actionButtonsHTML = `<button class="card-action-btn copy-script-btn" data-script="${item.scriptContent}" title="Copia o script.">Copiar Script <i class="fas fa-copy"></i></button>`;
        } else if (item.downloadLink && item.alternativeLink) {
            actionButtonsHTML = `
                <div class="card-action-group">
                    <a href="${item.downloadLink}" target="_blank" rel="noopener noreferrer" class="card-action-btn">Download <i class="fas fa-download"></i></a>
                    <a href="${item.alternativeLink}" target="_blank" rel="noopener noreferrer" class="card-action-btn alt">Alternativo</a>
                </div>`;
        } else {
            let actionLink = '#';
            if (item.downloadLink) actionLink = item.downloadLink;
            else if (item.accessLink) actionLink = item.accessLink;
            else if (item.gameUrl) actionLink = item.gameUrl;
            else if (item.rom) {
                const romPath = `roms/${item.rom}`;
                actionLink = `player.html?core=${item.core}&rom=${encodeURIComponent(romPath)}`;
            }
            actionButtonsHTML = `<a href="${actionLink}" target="_blank" rel="noopener noreferrer" class="card-action-btn">Acessar <i class="fas fa-arrow-right"></i></a>`;
        }

        const tagsHTML = createTagsHTML(item.tags);
        const delay = index * 50; 
        const style = `style="animation-delay: ${delay}ms"`;

        return `
            <div class="card" ${style}>
                <button class="card-fav-btn ${activeClass}" data-title="${item.title}"><i class="${favIconClass}"></i></button>
                <div>
                    <div class="card-icon"><i class="${item.icon || 'fas fa-question-circle'}"></i></div>
                    <h3 class="card-title">${item.title}</h3>
                    ${tagsHTML}
                    <p class="card-description">${item.description}</p>
                </div>
                <div class="card-actions-wrapper">${actionButtonsHTML}</div>
            </div>`;
    };
    
    const createHomePage = () => {
        const allItems = Object.values(DB).flat();
        const featuredItems = allItems.filter(item => item.featured);
        const featuredHTML = featuredItems.length > 0
            ? `<h2 class="section-title">Em Destaque</h2><div class="card-grid">${featuredItems.map((item, i) => createCard(item, i)).join('')}</div>`
            : '';

        return `
            <main class="fade-in">
                <section class="hero-section">
                    <h2 class="hero-title">Acesso Restrito</h2>
                    <p class="hero-subtitle">Bem-vindo ao hub. Selecione uma categoria no menu acima para começar.</p>
                    <a href="#pcGames" data-page="pcGames" class="hero-cta nav-btn">Explorar Jogos</a>
                </section>
                <section class="featured-section">${featuredHTML}</section>
            </main>`;
    };

    const createCategoryPage = (categoryKey, title) => {
        let items = [];
        if (categoryKey === 'favorites') {
            const allItems = Object.values(DB).flat();
            items = allItems.filter(item => state.favorites.includes(item.title));
        } else {
            items = DB[categoryKey] || [];
        }

        if (state.activeTag) {
            items = items.filter(item => item.tags && item.tags.includes(state.activeTag));
        }
        
        let creditsHTML = '';
        if (categoryKey === 'pcGames') {
            creditsHTML = `<p class="section-credits">
                Conteúdo: <a href="https://steamrip.com" target="_blank" class="credit-highlight">SteamRIP</a>, 
                <a href="https://archive.org" target="_blank" class="credit-highlight">Archive</a> & 
                <a href="https://discord.gg/tvxEKnEDpn" target="_blank" class="credit-highlight">ChemicalFl00d (NFS)</a>
            </p>`;
        } else if (categoryKey === 'hacks') {
            creditsHTML = `<p class="section-credits">Desenvolvido por <a href="https://discord.com/invite/platformdestroyer" target="_blank" class="credit-highlight">Platform Destroyer</a></p>`;
        }

        let filterHTML = state.activeTag ? `
            <div class="active-filters">
                <span class="filter-chip" id="clear-filter">Filtro: ${state.activeTag} <i class="fas fa-times"></i></span>
            </div>` : '';

        if (items.length === 0) {
            const msg = state.activeTag ? "Nenhum item com essa tag." : (categoryKey === 'favorites' ? "Você ainda não favoritou nada." : "Nenhum item aqui.");
            return `
                <main class="fade-in">
                    <h2 class="section-title">${title}</h2>
                    ${filterHTML}
                    <p class="text-center" style="color:var(--text-secondary); margin-top: 2rem;">${msg}</p>
                </main>`;
        }
        
        const cardsHTML = items.map((item, index) => createCard(item, index)).join('');
        return `
            <main>
                <h2 class="section-title fade-in">${title}</h2>
                ${filterHTML}
                ${creditsHTML}
                <div class="card-grid">${cardsHTML}</div>
                <div class="no-results">
                    <i class="fas fa-ghost"></i>
                    <h3>Nenhum resultado encontrado</h3>
                    <p>Tente buscar por outros termos.</p>
                </div>
            </main>`;
    };

    const handleSearch = () => {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const cards = document.querySelectorAll('.card-grid .card');
        const noResultsMessage = document.querySelector('.no-results');
        let visibleCount = 0;

        cards.forEach(card => {
            const title = card.querySelector('.card-title').textContent.toLowerCase();
            if (title.includes(searchTerm)) { card.style.display = 'flex'; visibleCount++; }
            else { card.style.display = 'none'; }
        });

        if (noResultsMessage) noResultsMessage.style.display = visibleCount === 0 ? 'block' : 'none';
    };

    const debounce = (func, delay) => {
        let timeout;
        return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), delay); };
    };

    const render = () => {
        const pageTitles = {
            inicio: 'Início', favorites: 'Meus Favoritos', pcGames: 'Jogos PC',
            browserGames: 'Jogos de Navegador', emulatorGames: 'Jogos de Emulador', 
            hacks: 'Hacks', tools: 'Ferramentas'
        };

        const pageContentHTML = state.currentPage === 'inicio' 
            ? createHomePage()
            : createCategoryPage(state.currentPage, pageTitles[state.currentPage] || 'Página');

        appContainer.innerHTML = `<div class="app-wrapper">${createHeader()}${pageContentHTML}${createFooter()}</div>`;
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.addEventListener('keyup', debounce(handleSearch, 300));
        }

        window.scrollTo(0, 0);
    };
    
    const router = () => {
        const hash = window.location.hash.substring(1);
        const validPages = ['inicio', 'favorites', 'pcGames', 'browserGames', 'emulatorGames', 'hacks', 'tools'];
        state.currentPage = validPages.includes(hash) ? hash : 'inicio';
        state.activeTag = null; 
        render();
    };

    const init = async () => {
        document.body.addEventListener('click', (e) => {
            const navBtn = e.target.closest('.nav-btn');
            if (navBtn) {
                e.preventDefault();
                const page = navBtn.dataset.page;
                if (page && `#${page}` !== window.location.hash) {
                    window.location.hash = page;
                }
                return;
            }

            const favBtn = e.target.closest('.card-fav-btn');
            if (favBtn) {
                toggleFavorite(favBtn.dataset.title, favBtn);
                return;
            }

            const tagBtn = e.target.closest('.tag');
            if (tagBtn) {
                state.activeTag = tagBtn.dataset.tag;
                render();
                return;
            }
            if (e.target.closest('#clear-filter')) {
                state.activeTag = null;
                render();
                return;
            }

            const copyBtn = e.target.closest('.copy-script-btn');
            if (copyBtn) {
                const script = copyBtn.dataset.script;
                navigator.clipboard.writeText(script).then(() => {
                    const originalText = copyBtn.innerHTML;
                    copyBtn.innerHTML = 'Copiado! <i class="fas fa-check"></i>';
                    setTimeout(() => copyBtn.innerHTML = originalText, 2000);
                });
                return;
            }

            if (e.target.closest('#boss-btn')) { toggleBossMode(); return; }
        });

        // ATALHO DE PÂNICO: TECLA BARRA INVERTIDA (\)
        document.addEventListener('keydown', (e) => { 
            // Tecla '\' (Geralmente perto do Z ou Shift em ABNT2) ou Insert por garantia
            if (e.key === '\\' || e.key === 'Insert') {
                toggleBossMode();
            }
        });
        
        if(exitBossBtn) {
            exitBossBtn.addEventListener('click', toggleBossMode);
        }

        if (backToTopBtn) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 300) backToTopBtn.classList.add('visible');
                else backToTopBtn.classList.remove('visible');
            });
            backToTopBtn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
        }

        window.addEventListener('hashchange', router);

        try {
            const response = await fetch('data/db.json?v=' + new Date().getTime());
            DB = await response.json();
            router();
        } catch (error) {
            appContainer.innerHTML = `<p style="color:red; text-align:center; padding: 2rem;">Erro crítico: Não foi possível carregar o banco de dados (db.json).</p>`;
            console.error(error);
        } finally {
            if (loader) { 
                loader.style.opacity = '0'; 
                loader.style.visibility = 'hidden';
                setTimeout(() => loader.style.display = 'none', 400); 
            }
        }
    };

    init();
});
