import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const subsetPath = path.join(root, 'assets/css/theme-subset.css');
const legacyPath = path.join(root, 'assets/css/style-3.03029.1.css');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const serviceWorker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const errors = [];

if (!fs.existsSync(subsetPath)) {
  errors.push('缺少首页精简主题样式。');
} else {
  const css = fs.readFileSync(subsetPath, 'utf8');
  const bytes = fs.statSync(subsetPath).size;
  const requiredRules = [
    '.page-container', '.main-content', '.page-header', '.sidebar-nav',
    '.content-site', '.header-big', '.search-type', '.url-card', '.url-body',
    '.col-xl-5a', '.io-grey-mode', '.io-black-mode'
  ];

  if (bytes > 35_000) errors.push(`首页精简主题样式体积异常：${bytes} bytes。`);
  for (const rule of requiredRules) {
    if (!css.includes(rule)) errors.push(`首页精简主题样式缺少必要规则：${rule}`);
  }
  for (const breakpoint of ['min-width:768px', 'min-width:992px', 'max-width:767.98px']) {
    if (!css.includes(breakpoint)) errors.push(`首页精简主题样式缺少响应式断点：${breakpoint}`);
  }
}

if (fs.existsSync(legacyPath)) errors.push('完整旧主题样式仍然存在。');
if (!index.includes('id="theme-css"') || !index.includes('./assets/css/theme-subset.css?v=20260801-1')) {
  errors.push('首页没有加载版本化的精简主题样式。');
}
if (/style-3\.03029\.1\.css|id="iowen-css"/.test(index + serviceWorker)) {
  errors.push('页面或 Service Worker 仍引用旧主题样式。');
}
if (!serviceWorker.includes('/assets/css/theme-subset.css?v=20260801-1')) {
  errors.push('Service Worker 没有缓存精简主题样式。');
}

if (errors.length) {
  console.error(`首页精简主题样式校验失败（${errors.length} 项）：`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  const bytes = fs.statSync(subsetPath).size;
  console.log(`Theme subset valid: ${bytes} bytes, legacy bundle removed.`);
}
