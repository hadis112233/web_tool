import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const errors = [];

const coreMatch = sw.match(/const CORE = \[([\s\S]*?)\];/);
if (!coreMatch) {
  errors.push('未找到 Service Worker 的 CORE 缓存清单。');
} else {
  const core = [...coreMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map((match) => match[1]);
  const coreSet = new Set(core);

  for (const url of core) {
    if (!url.startsWith('/')) {
      errors.push(`CORE 中存在非站内地址：${url}`);
      continue;
    }
    if (url === '/') continue;
    const pathname = url.split('?')[0].replace(/^\//, '');
    if (!fs.existsSync(path.join(root, pathname))) {
      errors.push(`CORE 缓存文件不存在：${url}`);
    }
  }

  const versionedAssets = [...index.matchAll(/(?:href|src)="(\/assets\/[^"]+\?v=[^"]+)"/g)]
    .map((match) => match[1]);
  for (const url of versionedAssets) {
    if (!coreSet.has(url)) {
      errors.push(`首页版本化资源未加入 CORE：${url}`);
    }
  }

  for (const required of ['/', '/index.html', '/offline.html', '/manifest.webmanifest']) {
    if (!coreSet.has(required)) errors.push(`CORE 缺少离线必需项：${required}`);
  }
}

if (errors.length) {
  console.error(`Service Worker 校验失败（${errors.length} 项）：`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('Service Worker 校验通过：缓存文件存在，首页版本化资源已同步。');
}
