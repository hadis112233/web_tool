/* 首页独立交互：保持 HTML 无内联脚本，便于启用严格 CSP。 */
var theme = {
    ajaxurl: '', addico: '', order: 'asc', formpostion: 'top', defaultclass: 'io-grey-mode',
    isCustomize: '1', icourl: '', icopng: '.png', urlformat: '1', customizemax: '10',
    newWindow: '0', minNav: '1', loading: '0', hotWords: 'baidu',
    classColumns: ' col-sm-6 col-md-4 col-xl-5a col-xxl-6a ', apikey: ''
};

(function () {
    'use strict';
    function getNightMode() {
        return document.cookie.replace(/(?:(?:^|.*;\s*)night\s*\=\s*([^;]*).*$)|^.*$/, '$1') || '0';
    }
    function setSearchBackground() {
        var search = document.getElementById('search-bg');
        if (search) search.style.backgroundImage = 'url(assets/images/bg-dna.webp)';
    }
    function switchNightMode() {
        var isDark = getNightMode() === '0';
        document.body.classList.toggle('io-black-mode', isDark);
        document.body.classList.toggle('io-grey-mode', !isDark);
        document.cookie = 'night=' + (isDark ? '1' : '0') + ';path=/;SameSite=Lax';
        var button = document.querySelector('.switch-dark-mode');
        if (button) button.setAttribute('data-original-title', isDark ? '日间模式' : '夜间模式');
        document.querySelectorAll('.mode-ico').forEach(function (icon) {
            icon.classList.toggle('icon-night', !isDark);
            icon.classList.toggle('icon-light', isDark);
        });
        setSearchBackground();
    }

    if (getNightMode() === '1') document.body.classList.add('io-black-mode');
    setSearchBackground();

    // 旧版“常用”搜索已移除，清理失效的本地选择，回退到搜索分类。
    try {
        ['searchlist', 'searchlistmenu'].forEach(function (key) {
            var value = localStorage.getItem(key);
            var matchingMenu = value && Array.prototype.some.call(document.querySelectorAll('[data-id]'), function (item) {
                return item.getAttribute('data-id') === value;
            });
            if (value && !document.getElementById(value) && !matchingMenu) localStorage.removeItem(key);
        });
    } catch (error) {}

    // 让自定义搜索标签也能通过键盘切换。
    document.querySelectorAll('.s-search label[for]').forEach(function (label) {
        label.tabIndex = 0;
        label.addEventListener('keydown', function (event) {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            label.click();
        });
    });

    $(function () {
        var siteWelcome = $('#loading');
        siteWelcome.addClass('close');
        setTimeout(function () { siteWelcome.remove(); }, 600);

        setTimeout(function () {
            if (window.location.hash) {
                var target = document.querySelector(window.location.hash);
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 300);

        $(document).on('click', 'a.smooth', function (event) {
            var href = $(this).attr('href') || '';
            if ($('#sidebar').hasClass('show') && !$(this).hasClass('change-href')) $('#sidebar').modal('toggle');
            if (href.charAt(0) === '#') {
                event.preventDefault();
                var target = document.querySelector(href);
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            if ($(this).hasClass('go-search-btn')) $('#search-text').trigger('focus');
        });
        $(document).on('click', 'a.tab-noajax', function () {
            var url = $(this).data('link');
            $(this).parents('.d-flex.flex-fill.flex-tab').children('.btn-move.tab-move').toggle(!!url).attr('href', url || '#');
        });
        $(document).on('click', '.switch-dark-mode', function (event) {
            event.preventDefault();
            switchNightMode();
        });
    });
}());
