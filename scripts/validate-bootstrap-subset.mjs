import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const subsetPath = path.join(root, 'assets/css/bootstrap-subset.css');
const legacyPath = path.join(root, 'assets/css/bootstrap.min-4.3.1.css');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const serviceWorker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const errors = [];

if (!fs.existsSync(subsetPath)) {
  errors.push('缺少 Bootstrap 精简样式。');
} else {
  const css = fs.readFileSync(subsetPath, 'utf8');
  const bytes = fs.statSync(subsetPath).size;
  const requiredRules = [
    '.container-fluid', '.row', '.col-6', '.col-sm-6', '.col-md-4',
    '.navbar', '.navbar-expand-md', '.form-control', '.d-none', '.d-flex',
    '.modal-dialog', '.collapse:not(.show)', '.rounded-circle'
  ];

  if (bytes > 20_000) errors.push(`Bootstrap 精简样式体积异常：${bytes} bytes。`);
  if (!css.includes('Bootstrap v4.3.1') || !css.includes('Licensed under MIT')) {
    errors.push('Bootstrap 精简样式缺少原许可证信息。');
  }
  for (const rule of requiredRules) {
    if (!css.includes(rule)) errors.push(`Bootstrap 精简样式缺少必要规则：${rule}`);
  }
}

if (fs.existsSync(legacyPath)) errors.push('完整 Bootstrap 样式仍然存在。');
if (!index.includes('./assets/css/bootstrap-subset.css?v=20260801-1')) {
  errors.push('首页没有加载版本化的 Bootstrap 精简样式。');
}
if (/bootstrap\.min-4\.3\.1\.css/.test(index + serviceWorker)) {
  errors.push('页面或 Service Worker 仍引用完整 Bootstrap 样式。');
}
if (!serviceWorker.includes('/assets/css/bootstrap-subset.css?v=20260801-1')) {
  errors.push('Service Worker 没有缓存 Bootstrap 精简样式。');
}

if (errors.length) {
  console.error(`Bootstrap 精简样式校验失败（${errors.length} 项）：`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  const bytes = fs.statSync(subsetPath).size;
  console.log(`Bootstrap subset valid: ${bytes} bytes, legacy bundle removed.`);
}
