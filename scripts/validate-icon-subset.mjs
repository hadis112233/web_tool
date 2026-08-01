import { readFile } from 'node:fs/promises';

const sourceFiles = [
  'index.html',
  'commit.html',
  'about/index.html',
  'assets/js/commit-page.js'
];
const helperClasses = new Set(['fa-lg', 'fa-spin']);
const iconCss = await readFile('assets/css/static-icons.css', 'utf8');
const defined = new Set(
  Array.from(iconCss.matchAll(/\.(fa-[a-z0-9-]+)::before/g), (match) => match[1])
);
const used = new Set();

for (const file of sourceFiles) {
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(/\bfa-[a-z0-9-]+\b/g)) {
    if (!helperClasses.has(match[0])) used.add(match[0]);
  }
}

const missing = Array.from(used).filter((name) => !defined.has(name)).sort();
if (missing.length) {
  throw new Error(`精简图标样式缺少定义：${missing.join(', ')}`);
}
if (/fontawesome-5\.15\.4\/css\/all\.min\.css/.test(await readFile('index.html', 'utf8'))) {
  throw new Error('首页仍在加载完整 Font Awesome 样式。');
}

console.log(`Icon subset valid: ${used.size} used icons have matching definitions.`);
