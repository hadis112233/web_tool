import { readFile } from 'node:fs/promises';

const sourceFiles = [
  'index.html',
  'commit.html',
  'about/index.html',
  'assets/js/commit-page.js',
  'assets/js/index-page.js',
  'assets/js/site-enhancements.js'
];
const helperClasses = new Set(['fa-lg', 'fa-spin']);
const legacyHelpers = new Set(['icon-192', 'icon-2x', 'icon-fw', 'icon-lg']);
const iconCss = await readFile('assets/css/static-icons.css', 'utf8');
const legacyIconCss = await readFile('assets/css/iconfont-3.03029.1.css', 'utf8');
const defined = new Set(
  Array.from(iconCss.matchAll(/\.(fa-[a-z0-9-]+)::before/g), (match) => match[1])
);
const used = new Set();
const usedLegacy = new Set();

for (const file of sourceFiles) {
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(/\bfa-[a-z0-9-]+\b/g)) {
    if (!helperClasses.has(match[0])) used.add(match[0]);
  }
  for (const match of source.matchAll(/\bicon-[a-z0-9-]+\b/g)) {
    if (!legacyHelpers.has(match[0])) usedLegacy.add(match[0]);
  }
}

const missing = Array.from(used).filter((name) => !defined.has(name)).sort();
if (missing.length) {
  throw new Error(`精简图标样式缺少定义：${missing.join(', ')}`);
}
const definedLegacy = new Set(
  Array.from(legacyIconCss.matchAll(/\.(icon-[a-z0-9-]+)::before/g), (match) => match[1])
);
const missingLegacy = Array.from(usedLegacy).filter((name) => !definedLegacy.has(name)).sort();
if (missingLegacy.length) {
  throw new Error(`精简 iconfont 缺少定义：${missingLegacy.join(', ')}`);
}
if (/iconfont-1616676273262|data:application\/x-font|nav\.iowen\.cn/.test(legacyIconCss)) {
  throw new Error('精简 iconfont 仍引用旧字体或远程资源。');
}
if (/fontawesome-5\.15\.4\/css\/all\.min\.css/.test(await readFile('index.html', 'utf8'))) {
  throw new Error('首页仍在加载完整 Font Awesome 样式。');
}

console.log(`Icon subsets valid: ${used.size} Font Awesome icons and ${usedLegacy.size} iconfont icons.`);
