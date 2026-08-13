import fs from 'node:fs';

const pages = [
  { file: 'about/index.html', container: 'about-container' },
  { file: 'commit.html', container: 'submit-container' }
];
const errors = [];

for (const page of pages) {
  const html = fs.readFileSync(page.file, 'utf8');
  for (const markup of [
    'class="skip-link" href="#main-content"',
    `<main class="${page.container}" id="main-content" tabindex="-1">`,
    '</main>',
    '.skip-link:focus',
    ':focus-visible',
    'prefers-reduced-motion: reduce'
  ]) {
    if (!html.includes(markup)) errors.push(`${page.file} 缺少辅助访问能力：${markup}`);
  }
}

const commit = fs.readFileSync('commit.html', 'utf8');
for (const markup of [
  '<form id="submitForm" aria-busy="false">',
  'autocomplete="url" inputmode="url"',
  'autocomplete="email" inputmode="email"',
  'aria-describedby="submitNotice"',
  'id="submitNotice"'
]) {
  if (!commit.includes(markup)) errors.push(`commit.html 缺少易填写或提交状态标记：${markup}`);
}
const commitScript = fs.readFileSync('assets/js/commit-page.js', 'utf8');
for (const markup of ["form.setAttribute('aria-busy'", 'setBusy(true)', 'setBusy(false)']) {
  if (!commitScript.includes(markup)) errors.push(`提交脚本缺少忙碌状态同步：${markup}`);
}
if (/\bsuccessMessage\b|\.success-message\b/.test(commit)) {
  errors.push('提交页仍包含未使用的旧成功提示。');
}
if (/\.form-control:focus\s*\{[^}]*outline:\s*none/is.test(commit)) {
  errors.push('提交页表单控件移除了键盘焦点轮廓。');
}

const notFound = fs.readFileSync('404.html', 'utf8');
for (const markup of ['<main class="card">', '.button:focus-visible', 'prefers-reduced-motion:reduce']) {
  if (!notFound.includes(markup)) errors.push(`404.html 缺少辅助访问能力：${markup}`);
}

if (errors.length) {
  console.error(`辅助页面无障碍校验失败（${errors.length} 项）：`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('Secondary page accessibility valid: landmarks, skip links, focus styles, reduced motion, and dead-state cleanup passed.');
}
