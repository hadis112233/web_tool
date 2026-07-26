(function () {
    'use strict';

    var STORAGE_KEY = 'hadis-tool-nav-favorites';
    var content = document.getElementById('content');
    if (!content) return;

    document.addEventListener('error', function (event) {
        var image = event.target;
        if (image.tagName !== 'IMG' || image.dataset.fallbackApplied === 'true') return;
        image.dataset.fallbackApplied = 'true';
        image.src = 'assets/images/logos/default.webp';
    }, true);

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () { navigator.serviceWorker.register('./sw.js').catch(function () {}); });
    }
    if ('PerformanceObserver' in window && navigator.sendBeacon) {
        try {
            new PerformanceObserver(function (list) {
                list.getEntries().forEach(function (entry) {
                    if (entry.entryType === 'largest-contentful-paint') {
                        navigator.sendBeacon('/api/telemetry', JSON.stringify({ event: 'lcp', value: Math.round(entry.startTime), path: location.pathname }));
                    }
                });
            }).observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (error) {}
    }

    Array.prototype.slice.call(document.querySelectorAll('a[target="_blank"]')).forEach(function (link) {
        var rel = link.getAttribute('rel') || '';
        if (!/\bnoopener\b/.test(rel)) rel += (rel ? ' ' : '') + 'noopener';
        if (!/\bnoreferrer\b/.test(rel)) rel += (rel ? ' ' : '') + 'noreferrer';
        link.setAttribute('rel', rel);
    });

    function readFavorites() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
        catch (error) { return []; }
    }

    function writeFavorites(favorites) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    }

    var favorites = readFavorites();
    var cards = Array.prototype.slice.call(content.querySelectorAll('.url-card'));
    cards.forEach(function (card) {
        card.querySelectorAll('img').forEach(function (image) {
            image.loading = 'lazy';
            image.decoding = 'async';
        });
    });
    var sections = Array.prototype.slice.call(content.children).reduce(function (result, element, index, children) {
        if (element.classList.contains('d-flex') && children[index + 1] && children[index + 1].classList.contains('row')) {
            result.push({ heading: element, row: children[index + 1] });
        }
        return result;
    }, []);

    var dashboard = document.createElement('section');
    dashboard.className = 'nav-dashboard';
    dashboard.setAttribute('aria-label', '导航筛选工具');
    dashboard.innerHTML =
        '<div class="dashboard-copy"><strong>资源导航</strong><small id="filter-status" aria-live="polite">' + cards.length + ' 个链接 · ' + sections.length + ' 个分类</small></div>' +
        '<label class="dashboard-search"><input id="site-filter" type="search" placeholder="筛选网站、工具或描述" autocomplete="off" aria-label="筛选网站、工具或描述" aria-keyshortcuts="/"><span>⌕</span></label>' +
        '<div class="dashboard-actions"><button class="dashboard-button favorites-toggle" id="favorites-toggle" type="button" aria-pressed="false"><span aria-hidden="true">♡</span> 收藏夹</button><button class="dashboard-button reset-button" id="filter-reset" type="button">清除</button></div>';
    content.insertBefore(dashboard, content.firstChild);

    var filterInput = dashboard.querySelector('#site-filter');
    var favoriteToggle = dashboard.querySelector('#favorites-toggle');
    var resetButton = dashboard.querySelector('#filter-reset');
    var filterStatus = dashboard.querySelector('#filter-status');
    var empty = document.createElement('div');
    empty.className = 'filter-empty';
    empty.textContent = '没有找到匹配资源，换个关键词试试。';
    dashboard.insertAdjacentElement('afterend', empty);

    // 首页精选：复用已有卡片内容，避免维护两套链接与图标数据。
    var featuredNames = ['GitHub', '阿里云', '有道词典', '办公工具站', 'PDFCraft', '抖音'];
    var featuredCards = featuredNames.map(function (name) {
        return cards.find(function (card) {
            var title = card.querySelector('strong');
            return title && title.textContent.trim() === name;
        });
    }).filter(Boolean);
    if (featuredCards.length) {
        var featured = document.createElement('section');
        featured.className = 'featured-resources';
        featured.setAttribute('aria-labelledby', 'featured-title');
        featured.innerHTML = '<div class="featured-heading"><div><span class="featured-kicker">HADIS PICKS</span><h2 id="featured-title">精选资源</h2><p>为日常工作与学习优先整理的常用入口</p></div><a href="#all-resources" class="featured-all">查看全部 <span aria-hidden="true">→</span></a></div><div class="row featured-grid"></div>';
        var featuredGrid = featured.querySelector('.featured-grid');
        featuredCards.forEach(function (card) {
            var clone = card.cloneNode(true);
            clone.classList.add('featured-card');
            clone.removeAttribute('hidden');
            var direct = clone.querySelector('.togo');
            if (direct) direct.remove();
            featuredGrid.appendChild(clone);
        });
        dashboard.insertAdjacentElement('afterend', featured);
    }

    var firstCategory = sections[0] && sections[0].heading;
    if (firstCategory) firstCategory.id = 'all-resources';
    var showingFavorites = false;

    function getUrl(card) {
        var link = card.querySelector('a.card');
        return link ? (link.getAttribute('data-url') || link.href) : '';
    }

    function updateButton(button, url) {
        var active = favorites.indexOf(url) !== -1;
        button.classList.toggle('is-favorite', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
        button.setAttribute('aria-label', active ? '取消收藏' : '收藏此网站');
        button.textContent = active ? '♥' : '♡';
    }

    function filterCards() {
        var term = filterInput.value.trim().toLocaleLowerCase();
        var visibleCount = 0;
        cards.forEach(function (card) {
            var url = getUrl(card);
            var matchTerm = !term || card.textContent.toLocaleLowerCase().indexOf(term) !== -1 || url.toLocaleLowerCase().indexOf(term) !== -1;
            var matchFavorite = !showingFavorites || favorites.indexOf(url) !== -1;
            var visible = matchTerm && matchFavorite;
            card.hidden = !visible;
            if (visible) visibleCount += 1;
        });
        sections.forEach(function (section) {
            var hasVisible = Array.prototype.some.call(section.row.querySelectorAll('.url-card'), function (card) { return !card.hidden; });
            section.heading.hidden = !hasVisible;
            section.row.hidden = !hasVisible;
        });
        empty.classList.toggle('is-visible', visibleCount === 0);
        filterStatus.textContent = showingFavorites ? '显示 ' + visibleCount + ' 个已收藏资源' : '显示 ' + visibleCount + ' 个资源';
    }

    cards.forEach(function (card) {
        var link = card.querySelector('a.card');
        if (!link) return;
        link.setAttribute('rel', 'noopener noreferrer');
        var button = document.createElement('button');
        var url = getUrl(card);
        button.type = 'button';
        button.className = 'favorite-button';
        updateButton(button, url);
        button.addEventListener('click', function () {
            var position = favorites.indexOf(url);
            if (position === -1) favorites.push(url);
            else favorites.splice(position, 1);
            writeFavorites(favorites);
            cards.forEach(function (item) {
                if (getUrl(item) === url) updateButton(item.querySelector('.favorite-button'), url);
            });
            filterCards();
        });
        card.querySelector('.url-body').appendChild(button);
    });

    filterInput.addEventListener('input', filterCards);
    filterInput.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') { filterInput.value = ''; filterCards(); }
    });
    favoriteToggle.addEventListener('click', function () {
        showingFavorites = !showingFavorites;
        favoriteToggle.classList.toggle('is-active', showingFavorites);
        favoriteToggle.setAttribute('aria-pressed', showingFavorites ? 'true' : 'false');
        favoriteToggle.innerHTML = '<span aria-hidden="true">' + (showingFavorites ? '♥' : '♡') + '</span> 收藏夹';
        filterCards();
    });
    resetButton.addEventListener('click', function () {
        filterInput.value = '';
        showingFavorites = false;
        favoriteToggle.classList.remove('is-active');
        favoriteToggle.setAttribute('aria-pressed', 'false');
        favoriteToggle.innerHTML = '<span aria-hidden="true">♡</span> 收藏夹';
        filterCards();
    });
    document.addEventListener('keydown', function (event) {
        if (event.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            event.preventDefault();
            filterInput.focus();
        }
    });

    document.querySelectorAll('a[target="_blank"]').forEach(function (link) {
        link.setAttribute('rel', 'noopener noreferrer');
    });
}());
