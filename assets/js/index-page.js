(function () {
    'use strict';

    var sidebar = document.getElementById('sidebar');
    var sidebarSwitch = document.getElementById('sidebar-switch');
    var miniButton = document.getElementById('mini-button');
    var search = document.getElementById('search');
    var searchInput = document.getElementById('search-text');
    var goUp = document.getElementById('go-to-up');
    var headerBanner = document.querySelector('.big-header-banner');
    var themeButton = document.querySelector('.switch-dark-mode');
    var themeColor = document.querySelector('meta[name="theme-color"]');
    var installButton = document.getElementById('install-app');
    var installStatus = document.getElementById('install-status');
    var shareButton = document.getElementById('share-site');
    var shareStatus = document.getElementById('share-status');
    var searchMenu = search && search.querySelector('.s-type-list.big');

    function storageGet(key) {
        try { return window.localStorage.getItem(key); }
        catch (error) { return null; }
    }

    function storageSet(key, value) {
        try { window.localStorage.setItem(key, value); }
        catch (error) {}
    }

    function getNightMode() {
        return document.cookie.replace(/(?:(?:^|.*;\s*)night\s*\=\s*([^;]*).*$)|^.*$/, '$1');
    }

    function getPreferredNightMode() {
        var savedMode = getNightMode();
        if (savedMode === '0' || savedMode === '1') return savedMode === '1';
        return Boolean(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }

    function applyTheme(isDark) {
        document.body.classList.toggle('io-black-mode', isDark);
        document.body.classList.toggle('io-grey-mode', !isDark);
        if (themeColor) themeColor.setAttribute('content', isDark ? '#0f172a' : '#2563eb');
        if (themeButton) {
            themeButton.title = isDark ? '切换到日间模式' : '切换到夜间模式';
            themeButton.setAttribute('aria-label', themeButton.title);
        }
        document.querySelectorAll('.mode-ico').forEach(function (icon) {
            icon.classList.toggle('icon-night', !isDark);
            icon.classList.toggle('icon-light', isDark);
        });
    }

    function switchNightMode() {
        var isDark = !document.body.classList.contains('io-black-mode');
        applyTheme(isDark);
        document.cookie = 'night=' + (isDark ? '1' : '0') + ';path=/;SameSite=Lax;max-age=31536000';
    }

    function setShareStatus(message) {
        if (shareStatus) shareStatus.textContent = message;
    }

    var deferredInstallPrompt = null;

    function setInstallStatus(message) {
        if (installStatus) installStatus.textContent = message;
    }

    function hideInstallButton() {
        if (installButton) installButton.hidden = true;
    }

    function installApp() {
        if (!deferredInstallPrompt) return;
        hideInstallButton();
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then(function (choice) {
            setInstallStatus(choice.outcome === 'accepted' ? '正在安装 Hadis 工具导航。' : '已取消安装。');
            deferredInstallPrompt = null;
        }).catch(function () {
            setInstallStatus('暂时无法显示安装提示。');
            deferredInstallPrompt = null;
        });
    }

    function copyShareLink(url) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(url);
        }
        return new Promise(function (resolve, reject) {
            var input = document.createElement('textarea');
            input.value = url;
            input.setAttribute('readonly', '');
            input.style.position = 'fixed';
            input.style.opacity = '0';
            document.body.appendChild(input);
            input.select();
            var copied = document.execCommand('copy');
            input.remove();
            copied ? resolve() : reject(new Error('copy failed'));
        });
    }

    function shareSite() {
        var canonical = document.querySelector('link[rel="canonical"]');
        var url = canonical ? canonical.href : window.location.href;
        var data = { title: document.title, text: '常用网站与在线工具，一站直达。', url: url };
        if (navigator.share) {
            navigator.share(data).then(function () {
                setShareStatus('已完成分享。');
            }).catch(function (error) {
                if (error && error.name === 'AbortError') return;
                copyShareLink(url).then(function () {
                    setShareStatus('系统分享不可用，链接已复制。');
                }).catch(function () {
                    setShareStatus('暂时无法分享，请复制浏览器地址栏链接。');
                });
            });
            return;
        }
        copyShareLink(url).then(function () {
            setShareStatus('链接已复制。');
        }).catch(function () {
            setShareStatus('暂时无法复制链接，请复制浏览器地址栏链接。');
        });
    }

    function syncSidebarAccessibility() {
        if (!sidebar) return;
        var isMobile = window.innerWidth < 768;
        var isOpen = isMobile && sidebar.classList.contains('show');
        var isHidden = isMobile && !isOpen;
        sidebar.setAttribute('aria-hidden', isHidden ? 'true' : 'false');
        sidebar.inert = isHidden;
        if (sidebarSwitch) sidebarSwitch.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    function closeSidebar(restoreFocus) {
        if (!sidebar) return;
        var wasOpen = sidebar.classList.contains('show');
        sidebar.classList.remove('show');
        document.body.classList.remove('sidebar-open');
        syncSidebarAccessibility();
        if (wasOpen && restoreFocus !== false && sidebarSwitch) sidebarSwitch.focus();
    }

    function openSidebar() {
        if (!sidebar) return;
        sidebar.classList.remove('mini-sidebar');
        sidebar.classList.add('show');
        document.body.classList.add('sidebar-open');
        syncSidebarAccessibility();
        var firstLink = sidebar.querySelector('.sidebar-menu-inner a[href]');
        if (firstLink) firstLink.focus();
    }

    function setMiniSidebar(collapsed) {
        if (!sidebar || window.innerWidth < 768) {
            if (sidebar) {
                sidebar.classList.remove('mini-sidebar');
                sidebar.style.width = '';
            }
            return;
        }
        sidebar.classList.toggle('mini-sidebar', collapsed);
        sidebar.style.width = collapsed ? '60px' : '170px';
        if (!collapsed) {
            sidebar.querySelectorAll('.sidebar-show').forEach(function (item) {
                item.classList.remove('sidebar-show');
            });
        }
    }

    function moveSearchAnchor() {
        if (!searchMenu) return;
        var active = searchMenu.querySelector('label.active');
        var anchor = searchMenu.querySelector('.anchor');
        if (!active || !anchor) return;
        anchor.style.left = active.offsetLeft + 'px';
        anchor.style.width = active.offsetWidth + 'px';
        anchor.style.opacity = '1';
    }

    function availableSearchTargets() {
        if (!search) return [];
        return Array.prototype.map.call(
            search.querySelectorAll('.search-group input[type="radio"]'),
            function (input) { return input.value; }
        );
    }

    function syncSearch() {
        if (!search) return;
        var selected = search.querySelector('.search-group input[type="radio"]:checked');
        if (!selected) return;
        search.querySelectorAll('.search-group').forEach(function (group) {
            group.classList.toggle('s-current', group.contains(selected));
        });
        var groupName = Array.prototype.find.call(selected.closest('.search-group').classList, function (name) {
            return name.indexOf('group-') === 0;
        });
        var activeMenu = searchMenu && searchMenu.querySelector('[data-id="' + groupName + '"]');
        if (activeMenu) {
            searchMenu.querySelectorAll('label[data-id]').forEach(function (label) {
                label.classList.toggle('active', label === activeMenu);
            });
            storageSet('searchlistmenu', groupName);
        }
        var form = search.querySelector('.super-search-fm');
        var input = search.querySelector('.search-key');
        if (form) form.dataset.searchTarget = selected.value;
        if (input) input.placeholder = selected.dataset.placeholder || '输入关键字搜索';
        storageSet('searchlist', selected.id);
        window.requestAnimationFrame(moveSearchAnchor);
    }

    function initializeSearch() {
        if (!search) return;
        var savedSearch = storageGet('searchlist');
        var savedInput = savedSearch && document.getElementById(savedSearch);
        if (savedInput && search.contains(savedInput)) savedInput.checked = true;

        search.querySelectorAll('label[for]').forEach(function (label) {
            label.tabIndex = 0;
            label.addEventListener('keydown', function (event) {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                label.click();
            });
        });
        search.querySelectorAll('.search-group input[type="radio"]').forEach(function (input) {
            input.addEventListener('change', function () {
                syncSearch();
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            });
        });
        if (searchMenu) {
            searchMenu.querySelectorAll('label[data-id]').forEach(function (label) {
                label.addEventListener('click', function () {
                    searchMenu.querySelectorAll('label[data-id]').forEach(function (item) {
                        item.classList.toggle('active', item === label);
                    });
                    window.requestAnimationFrame(moveSearchAnchor);
                });
            });
        }
        var form = search.querySelector('.super-search-fm');
        if (form) {
            form.addEventListener('submit', function (event) {
                event.preventDefault();
                var keyword = searchInput ? searchInput.value.trim() : '';
                if (!keyword) {
                    if (searchInput) searchInput.focus();
                    return;
                }
                var selectedTarget = form.dataset.searchTarget || '';
                var targets = availableSearchTargets();
                var target = targets.indexOf(selectedTarget) === -1 ? 'https://www.baidu.com/s?wd=' : selectedTarget;
                var opened = window.open(target + encodeURIComponent(keyword), '_blank', 'noopener,noreferrer');
                if (opened) opened.opener = null;
            });
        }
        syncSearch();
    }

    function updateScrollState() {
        var scrolled = window.scrollY >= 50;
        if (goUp) goUp.classList.toggle('is-visible', scrolled);
        if (headerBanner) headerBanner.classList.toggle('header-bg', scrolled);
    }

    function focusScrollTarget(target) {
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
    }

    applyTheme(getPreferredNightMode());
    var colorScheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    if (colorScheme) {
        var syncSystemTheme = function (event) {
            if (getNightMode() === '0' || getNightMode() === '1') return;
            applyTheme(event.matches);
        };
        if (typeof colorScheme.addEventListener === 'function') colorScheme.addEventListener('change', syncSystemTheme);
        else if (typeof colorScheme.addListener === 'function') colorScheme.addListener(syncSystemTheme);
    }
    initializeSearch();
    updateScrollState();

    syncSidebarAccessibility();
    if (sidebarSwitch) {
        sidebarSwitch.removeAttribute('data-toggle');
        sidebarSwitch.removeAttribute('data-target');
        sidebarSwitch.setAttribute('aria-controls', 'sidebar');
        sidebarSwitch.setAttribute('aria-expanded', 'false');
        sidebarSwitch.addEventListener('click', function (event) {
            event.preventDefault();
            sidebar.classList.contains('show') ? closeSidebar() : openSidebar();
        });
    }
    if (sidebar) {
        sidebar.addEventListener('click', function (event) {
            if (event.target === sidebar) {
                closeSidebar(true);
                return;
            }
            var link = event.target.closest('a[href]');
            if (window.innerWidth < 768 && link && !event.defaultPrevented) closeSidebar(false);
        });
        sidebar.querySelectorAll('.sidebar-menu-inner .sidebar-item > a').forEach(function (link) {
            var submenu = link.nextElementSibling;
            if (!submenu || submenu.tagName !== 'UL') return;
            link.setAttribute('aria-expanded', 'false');
            link.addEventListener('click', function (event) {
                event.preventDefault();
                var item = link.parentElement;
                var opening = !item.classList.contains('sidebar-show');
                item.parentElement.querySelectorAll(':scope > .sidebar-show').forEach(function (sibling) {
                    if (sibling !== item) {
                        sibling.classList.remove('sidebar-show');
                        var siblingLink = sibling.querySelector(':scope > a');
                        if (siblingLink) siblingLink.setAttribute('aria-expanded', 'false');
                    }
                });
                item.classList.toggle('sidebar-show', opening);
                link.setAttribute('aria-expanded', opening ? 'true' : 'false');
            });
        });
    }
    if (miniButton) {
        miniButton.addEventListener('change', function () {
            setMiniSidebar(miniButton.checked);
        });
    }
    if (themeButton) {
        themeButton.addEventListener('click', function (event) {
            event.preventDefault();
            switchNightMode();
        });
    }
    if (shareButton) {
        shareButton.addEventListener('click', shareSite);
    }
    if (installButton) {
        window.addEventListener('beforeinstallprompt', function (event) {
            event.preventDefault();
            deferredInstallPrompt = event;
            installButton.hidden = false;
        });
        window.addEventListener('appinstalled', function () {
            deferredInstallPrompt = null;
            hideInstallButton();
            setInstallStatus('Hadis 工具导航已安装。');
        });
        installButton.addEventListener('click', installApp);
    }
    if (goUp) {
        goUp.addEventListener('click', function (event) {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    document.addEventListener('click', function (event) {
        if (event.defaultPrevented) return;
        var link = event.target.closest('a.smooth');
        if (!link) return;
        var href = link.getAttribute('href') || '';
        if (href.charAt(0) !== '#' || href.length === 1) return;
        var target = document.getElementById(decodeURIComponent(href.slice(1)));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (link.classList.contains('go-search-btn') && searchInput) searchInput.focus();
        else focusScrollTarget(target);
        if (window.innerWidth < 768 && sidebar && sidebar.contains(link)) closeSidebar(false);
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') closeSidebar(true);
    });
    window.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', function () {
        setMiniSidebar(Boolean(miniButton && miniButton.checked));
        if (window.innerWidth >= 768) {
            closeSidebar(false);
        }
        syncSidebarAccessibility();
        window.requestAnimationFrame(moveSearchAnchor);
    });
    window.addEventListener('load', moveSearchAnchor);
}());
