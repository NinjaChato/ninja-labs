document.addEventListener('DOMContentLoaded', () => {

    const appContainer = document.getElementById('app-container');
    const loader = document.getElementById('loader');
    const backToTopBtn = document.getElementById('back-to-top');
    let DB = {};

    let state = {
        currentPage: 'inicio'
    };

    // --- TEMPLATES ---

    const createHeader = () => {
        const categories = {
            'inicio': { label: 'Início', icon: 'fa-home' },
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
                        <p class="site-description">Seu portal para jogos, ferramentas e recursos essenciais.</p>
                    </div>
                    <a href="https://discord.gg/ATS3E9ZeR7" target="_blank" rel="noopener noreferrer" class="discord-btn" title="Junte-se à nossa comunidade no Discord!">
                        <i class="fab fa-discord"></i>
                    </a>
                </div>
                <div class="header-bottom">
                    <div class="search-wrapper">
                        <i class="fas fa-search"></i>
                        <input type="text" id="searchInput" class="search-input" placeholder="Buscar na página atual...">
                    </div>
                    <nav class="nav-buttons">${navButtonsHTML}</nav>
                </div>
            </header>
        `;
    };

    const createFooter = () => {
        return `
            <footer class="site-footer fade-in">
                <p>Feito com <i class="fas fa-bolt"></i> por Ninja Labs &copy; 2025</p>
            </footer>
        `;
    };

    const createCard = (item, index = 0) => {
        let actionButtonsHTML = '';

        if (item.type === 'script') {
            actionButtonsHTML = `<button class="card-action-btn copy-script-btn" data-script="${item.scriptContent}" title="Copia o script para colar no campo de URL de um novo favorito.">Copiar Script <i class="fas fa-copy"></i></button>`;
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

        const delay = 200 + (index * 50); 
        const style = `style="animation-delay: ${delay}ms"`;

        return `
            <div class="card" ${style}>
                <div>
                    <div class="card-icon"><i class="${item.icon || 'fas fa-question-circle'}"></i></div>
                    <h3 class="card-title">${item.title}</h3>
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
                    <h2 class="hero-title">Acesso Direto ao Essencial</h2>
                    <p class="hero-subtitle">Navegue por uma seleção curada de jogos, ferramentas e recursos, sem distrações e com links diretos.</p>
                    <a href="#pcGames" data-page="pcGames" class="hero-cta nav-btn">Explorar Conteúdo</a>
                </section>
                <section class="featured-section">${featuredHTML}</section>
            </main>`;
    };

    const createCategoryPage = (categoryKey, title) => {
        const items = DB[categoryKey] || [];

        let creditsHTML = '';
        if (categoryKey === 'pcGames') {
            creditsHTML = `<p class="section-credits">Conteúdo fornecido por <a href="https://steamrip.com" target="_blank" class="credit-highlight">SteamRIP.com</a> e <a href="https://archive.org" target="_blank" class="credit-highlight">Archive.org</a></p>`;
        } else if (categoryKey === 'hacks') {
            creditsHTML = `<p class="section-credits">Desenvolvido por <a href="https://discord.com/invite/platformdestroyer" target="_blank" class="credit-highlight">Platform Destroyer</a></p>`;
        }

        if (items.length === 0) {
            return `<main class="fade-in"><h2 class="section-title">${title}</h2>${creditsHTML}<p class="text-center" style="color:var(--text-secondary)">Nenhum item adicionado a esta categoria ainda.</p></main>`;
        }

        const cardsHTML = items.map((item, index) => createCard(item, index)).join('');
        return `
            <main>
                <h2 class="section-title fade-in">${title}</h2>
                ${creditsHTML}
                <div class="card-grid">${cardsHTML}</div>
                <div class="no-results">
                    <i class="fas fa-ghost"></i>
                    <h3>Nenhum resultado encontrado</h3>
                    <p>Tente buscar por outros termos.</p>
                </div>
            </main>`;
    };

    // --- LÓGICA ---

    const handleSearch = () => {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const cards = document.querySelectorAll('.card-grid .card');
        const noResultsMessage = document.querySelector('.no-results');
        let visibleCount = 0;

        cards.forEach(card => {
            const title = card.querySelector('.card-title').textContent.toLowerCase();
            const description = card.querySelector('.card-description').textContent.toLowerCase();
            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        if (noResultsMessage) {
            noResultsMessage.style.display = visibleCount === 0 ? 'block' : 'none';
        }
    };

    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    const render = () => {
        const pageTitles = {
            inicio: 'Início', pcGames: 'Jogos para PC',
            browserGames: 'Jogos de Navegador', emulatorGames: 'Jogos de Emulador', 
            hacks: 'Hacks', tools: 'Ferramentas'
        };

        const pageContentHTML = state.currentPage === 'inicio' 
            ? createHomePage()
            : createCategoryPage(state.currentPage, pageTitles[state.currentPage] || 'Página');

        appContainer.innerHTML = `<div class="app-wrapper">${createHeader()}${pageContentHTML}${createFooter()}</div>`;

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keyup', debounce(handleSearch, 300));
        }

        window.scrollTo(0, 0);
    };

    const router = () => {
        const hash = window.location.hash.substring(1);
        const validPages = ['inicio', 'pcGames', 'browserGames', 'emulatorGames', 'hacks', 'tools'];
        state.currentPage = validPages.includes(hash) ? hash : 'inicio';
        render();
    };

    // --- INICIALIZAÇÃO ---

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

            const copyBtn = e.target.closest('.copy-script-btn');
            if (copyBtn) {
                const script = copyBtn.dataset.script;
                navigator.clipboard.writeText(script).then(() => {
                    const originalText = copyBtn.innerHTML;
                    copyBtn.innerHTML = 'Copiado! <i class="fas fa-check"></i>';
                    copyBtn.disabled = true;
                    setTimeout(() => {
                        copyBtn.innerHTML = originalText;
                        copyBtn.disabled = false;
                    }, 2000);
                });
                return;
            }
        });

        document.body.addEventListener('mousemove', (e) => {
            const cards = document.querySelectorAll('.card');
            cards.forEach(card => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            });
        });

        if (backToTopBtn) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 300) backToTopBtn.classList.add('visible');
                else backToTopBtn.classList.remove('visible');
            });

            backToTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        window.addEventListener('hashchange', router);

        try {
            const response = await fetch('data/db.json?v=' + new Date().getTime());
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            DB = await response.json();
            router();
        } catch (error) {
            appContainer.innerHTML = `<p style="color:red; text-align:center;">Falha ao carregar o banco de dados do site: ${error.message}</p>`;
        } finally {
            if (loader) {
                loader.style.opacity = '0';
                setTimeout(() => loader.style.display = 'none', 500);
            }
        }
    };

    init();
});
