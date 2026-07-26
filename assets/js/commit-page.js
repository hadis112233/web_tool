$(document).ready(function() {
            // 描述字数统计
            $('#description').on('input', function() {
                const count = $(this).val().length;
                $('#descCount').text(count);
            });

            // 表单验证
            function validateForm() {
                let isValid = true;

                // 清除之前的错误提示
                $('.form-control').removeClass('error').attr('aria-invalid', 'false');
                $('.error-message').hide();

                // 网站名称验证
                const siteName = $('#siteName').val().trim();
                if (!siteName) {
                    $('#siteName').addClass('error').attr('aria-invalid', 'true');
                    $('#siteNameError').show();
                    isValid = false;
                }

                // 网址验证
                const siteUrl = $('#siteUrl').val().trim();
                const urlPattern = /^https?:\/\/.+\..+/i;
                if (!siteUrl || !urlPattern.test(siteUrl)) {
                    $('#siteUrl').addClass('error').attr('aria-invalid', 'true');
                    $('#siteUrlError').show();
                    isValid = false;
                }

                // 分类验证
                const category = $('#category').val();
                if (!category) {
                    $('#category').addClass('error').attr('aria-invalid', 'true');
                    $('#categoryError').show();
                    isValid = false;
                }

                // 描述验证
                const description = $('#description').val().trim();
                if (!description) {
                    $('#description').addClass('error').attr('aria-invalid', 'true');
                    $('#descriptionError').show();
                    isValid = false;
                }

                // 邮箱验证
                const email = $('#email').val().trim();
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!email || !emailPattern.test(email)) {
                    $('#email').addClass('error').attr('aria-invalid', 'true');
                    $('#emailError').show();
                    isValid = false;
                }

                if (!isValid) {
                    $('.form-control.error').first().trigger('focus');
                }
                return isValid;
            }

            // 表单提交：部署到 Vercel 并配置邮件服务后直接提交；未配置时保留邮件兜底。
            $('#submitForm').on('submit', async function(e) {
                e.preventDefault();

                if (!validateForm()) {
                    return;
                }

                // 禁用提交按钮
                const $submitBtn = $('#submitBtn');
                $submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> 提交中...');

                // 收集表单数据
                const formData = {
                    siteName: $('#siteName').val().trim(),
                    siteUrl: $('#siteUrl').val().trim(),
                    category: $('#category').val(),
                    description: $('#description').val().trim(),
                    keywords: $('#keywords').val().trim(),
                    email: $('#email').val().trim(),
                    contact: $('#contact').val().trim(),
                    submitTime: new Date().toISOString()
                };

                // 本地保留最近的提交草稿，避免用户误关页面后丢失内容。
                const storageKey = 'hadis-tool-nav-submissions';
                let drafts = [];
                try {
                    drafts = JSON.parse(localStorage.getItem(storageKey)) || [];
                    drafts.unshift(formData);
                    localStorage.setItem(storageKey, JSON.stringify(drafts.slice(0, 20)));
                } catch (error) {
                    // 浏览器禁止本地存储时仍可提交。
                }

                try {
                    const response = await fetch('/api/submit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(Object.assign({ company: $('#company').val().trim() }, formData))
                    });
                    const result = await response.json().catch(function() { return {}; });
                    if (!response.ok) throw new Error(result.error || '提交服务暂时不可用。');
                    $('#submitResult').removeClass('error').addClass('success').text('提交成功，审核结果将发送到你的联系邮箱。');
                    this.reset();
                    $('#descCount').text('0/200');
                    $submitBtn.html('<i class="fas fa-check"></i> 提交成功');
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
                    $('#submitResult').removeClass('success').addClass('error').html('在线提交暂不可用，已为你准备邮件提交。<a href="' + mailto + '">打开邮件客户端</a>');
                    $submitBtn.html('<i class="fas fa-envelope"></i> 使用邮件提交');
                } finally {
                    setTimeout(function() {
                        $submitBtn.prop('disabled', false).html('<i class="fas fa-paper-plane"></i> 提交收录申请');
                    }, 1500);
                }

            });

            // 输入时移除错误状态
            $('.form-control').on('input change', function() {
                $(this).removeClass('error').attr('aria-invalid', 'false');
                $(this).siblings('.error-message').hide();
            });
        });
