import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const offline = fs.readFileSync(path.join(root, 'offline.html'), 'utf8');
const offlineScript = fs.readFileSync(path.join(root, 'assets/js/offline-page.js'), 'utf8');
const errors = [];

const cacheVersionMatch = sw.match(/const CACHE = ['"]hadis-nav-v(\d+)['"]/);
if (!cacheVersionMatch) {
  errors.push('Service Worker 缓存名称缺少数字版本号。');
} else if (Number(cacheVersionMatch[1]) < 17) {
  errors.push(`Service Worker 缓存版本过旧：v${cacheVersionMatch[1]}。`);
}

if (/CORE_URLS|cached\s*\|\|\s*fetch\(request\)/.test(sw)) {
  errors.push('核心资源仍使用永久 cache-first，更新后的文件可能无法及时生效。');
}
if (!sw.includes('event.waitUntil(networkUpdate') || !sw.includes('cached || networkUpdate')) {
  errors.push('静态资源未使用“缓存优先、后台刷新”策略。');
}

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

  const commit = fs.readFileSync(path.join(root, 'commit.html'), 'utf8');
  const versionedAssets = [index, commit, offline].flatMap((page) => [...page.matchAll(/(?:href|src)="(?:\.\/|\/)(assets\/[^"]+\?v=[^"]+)"/g)])
    .map((match) => `/${match[1]}`);
  for (const url of versionedAssets) {
    if (!coreSet.has(url)) {
      errors.push(`页面版本化资源未加入 CORE：${url}`);
    }
  }

  for (const required of ['/', '/index.html', '/about/index.html', '/commit.html', '/offline.html', '/manifest.webmanifest']) {
    if (!coreSet.has(required)) errors.push(`CORE 缺少离线必需项：${required}`);
  }
}

if (!sw.includes("['/commit', '/commit.html']")) {
  errors.push('Service Worker 缺少提交页离线路由回退。');
}
if (!sw.includes("['/about', '/about/index.html']")) {
  errors.push('Service Worker 缺少关于页离线路由回退。');
}
if (!sw.includes("NAVIGATION_FALLBACKS.get(normalizedPath) || '/offline.html'")) {
  errors.push('Service Worker 缺少未知页面的通用离线回退。');
}
if (!sw.includes('.catch(() => cachedNavigation(request))')) {
  errors.push('离线导航未调用按路由匹配的缓存页面。');
}

try {
  const sandbox = {
    URL,
    caches: {
      match(key) {
        return Promise.resolve(typeof key === 'string' ? key : undefined);
      }
    },
    self: {
      addEventListener() {},
      skipWaiting() {},
      clients: { claim() {} }
    }
  };
  vm.runInNewContext(`${sw}\nglobalThis.__cachedNavigation = cachedNavigation;`, sandbox);
  const routeCases = new Map([
    ['/commit', '/commit.html'],
    ['/about/', '/about/index.html'],
    ['/missing-page', '/offline.html']
  ]);
  for (const [route, expected] of routeCases) {
    const actual = await sandbox.__cachedNavigation({ url: `https://web.008997.xyz${route}` });
    if (actual !== expected) errors.push(`离线路由 ${route} 回退错误：${actual || '无结果'}`);
  }
} catch (error) {
  errors.push(`无法执行 Service Worker 离线路由测试：${error.message}`);
}

for (const requiredMarkup of ['id="retry-button"', 'id="network-status"', 'aria-live="polite"']) {
  if (!offline.includes(requiredMarkup)) errors.push(`离线页面缺少必要交互标记：${requiredMarkup}`);
}
for (const requiredBehavior of ["window.location.reload()", "addEventListener('online'", "addEventListener('offline'"]) {
  if (!offlineScript.includes(requiredBehavior)) errors.push(`离线页面脚本缺少必要行为：${requiredBehavior}`);
}

if (errors.length) {
  console.error(`Service Worker 校验失败（${errors.length} 项）：`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('Service Worker 校验通过：首页、关于页、提交页与版本化资源可离线使用，未知路由回退正常。');
}
