document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('submitForm');
    const submitButton = document.getElementById('submitBtn');
    const submitResult = document.getElementById('submitResult');
    const description = document.getElementById('description');
    const descriptionCount = document.getElementById('descCount');
    const controls = Array.from(form.querySelectorAll('.form-control'));

    const field = function (id) {
        return document.getElementById(id);
    };

    const setButton = function (icon, text) {
        submitButton.innerHTML = '<i class="fas ' + icon + '"></i> ' + text;
    };

    const setBusy = function (busy) {
        form.setAttribute('aria-busy', busy ? 'true' : 'false');
        submitButton.disabled = busy;
    };

    const clearError = function (control) {
        control.classList.remove('error');
        control.setAttribute('aria-invalid', 'false');
        const group = control.closest('.form-group');
        const error = group ? group.querySelector('.error-message') : null;
        if (error) error.style.display = 'none';
    };

    const showError = function (control, errorId) {
        control.classList.add('error');
        control.setAttribute('aria-invalid', 'true');
        const error = field(errorId);
        if (error) error.style.display = 'block';
    };

    const isValidHttpUrl = function (value) {
        try {
            const url = new URL(value);
            return ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.');
        } catch (error) {
            return false;
        }
    };

    const validateForm = function () {
        controls.forEach(clearError);
        const invalid = [];
        const siteName = field('siteName');
        const siteUrl = field('siteUrl');
        const category = field('category');
        const email = field('email');

        if (!siteName.value.trim()) invalid.push([siteName, 'siteNameError']);
        if (!isValidHttpUrl(siteUrl.value.trim())) invalid.push([siteUrl, 'siteUrlError']);
        if (!category.value) invalid.push([category, 'categoryError']);
        if (!description.value.trim()) invalid.push([description, 'descriptionError']);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) invalid.push([email, 'emailError']);

        invalid.forEach(function (entry) {
            showError(entry[0], entry[1]);
        });
        if (invalid.length) invalid[0][0].focus();
        return invalid.length === 0;
    };

    description.addEventListener('input', function () {
        descriptionCount.textContent = String(description.value.length);
    });

    controls.forEach(function (control) {
        ['input', 'change'].forEach(function (eventName) {
            control.addEventListener(eventName, function () {
                clearError(control);
            });
        });
    });

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        submitResult.textContent = '';
        submitResult.classList.remove('success', 'error');
        if (!validateForm()) return;

        setBusy(true);
        setButton('fa-spinner fa-spin', '提交中...');

        const formData = {
            siteName: field('siteName').value.trim(),
            siteUrl: field('siteUrl').value.trim(),
            category: field('category').value,
            description: description.value.trim(),
            keywords: field('keywords').value.trim(),
            email: field('email').value.trim(),
            contact: field('contact').value.trim(),
            submitTime: new Date().toISOString()
        };

        const controller = new AbortController();
        const timeout = window.setTimeout(function () {
            controller.abort();
        }, 10000);

        try {
            const response = await fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.assign({ company: field('company').value.trim() }, formData)),
                signal: controller.signal
            });
            const result = await response.json().catch(function () { return {}; });
            if (!response.ok) throw new Error(result.error || '提交服务暂时不可用。');

            submitResult.classList.add('success');
            submitResult.textContent = '提交成功，审核结果将发送到你的联系邮箱。';
            form.reset();
            descriptionCount.textContent = '0';
            setButton('fa-check', '提交成功');
        } catch (error) {
            const subject = '【网址收录申请】' + formData.siteName;
            const body = [
                '网站名称：' + formData.siteName,
                '网站网址：' + formData.siteUrl,
                '网站分类：' + formData.category,
                '网站描述：' + formData.description,
                '关键词：' + (formData.keywords || '未填写'),
                '联系邮箱：' + formData.email,
                '其他联系方式：' + (formData.contact || '未填写')
            ].join('\n');
            const mailto = 'mailto:wwd118932@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);

            submitResult.classList.add('error');
            submitResult.textContent = '在线提交暂不可用，已为你准备邮件提交。';
            const mailLink = document.createElement('a');
            mailLink.href = mailto;
            mailLink.textContent = '打开邮件客户端';
            submitResult.appendChild(document.createTextNode(' '));
            submitResult.appendChild(mailLink);
            setButton('fa-envelope', '使用邮件提交');
        } finally {
            window.clearTimeout(timeout);
            setBusy(false);
            setButton('fa-paper-plane', '提交收录申请');
        }
    });
});
