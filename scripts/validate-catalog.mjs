import { readFile } from 'node:fs/promises';

const catalog = JSON.parse(await readFile('data/sites.json', 'utf8'));
const commit = await readFile('commit.html', 'utf8');
const errors = [];
const ids = new Set();
const urls = new Set();
const retiredUrls = new Set([
  'https://www.iconfinder.com',
  'https://material.io/icons/',
  'https://typekit.com/',
  'http://www.pptplus.cn/',
  'https://affinity.serif.com/',
  'https://sketchapp.com/',
  'https://www.invisionapp.com/',
  'https://creative.adobe.com/zh-cn/products/download/muse',
  'https://klart.co/colors/',
  'https://www.elastic.co/blog/welcome-insight-io-to-the-elastic-team',
  'https://material.io/guidelines/',
  'https://developer.apple.com/ios/human-interface-guidelines'
]);
for (const category of catalog.categories || []) {
  if (!category.id || ids.has(category.id)) errors.push(`分类锚点重复或缺失：${category.name}`);
  ids.add(category.id);
  for (const site of category.sites || []) {
    if (!site.name || !site.url || !site.description || !site.image) errors.push(`网站字段不完整：${site.name || category.name}`);
    try { new URL(site.url); } catch { errors.push(`网址无效：${site.name}`); }
    if (urls.has(site.url)) errors.push(`网址重复：${site.url}`);
    if (retiredUrls.has(site.url)) errors.push(`仍在使用已停用或过时的网址：${site.name}（${site.url}）`);
    urls.add(site.url);
  }
}
const submitOptions = [...commit.matchAll(/<option value="([^"]+)">/g)]
  .map((match) => match[1])
  .filter(Boolean);
const expectedOptions = [...catalog.categories.map((category) => category.name), '其他'];
if (JSON.stringify(submitOptions) !== JSON.stringify(expectedOptions)) {
  errors.push('提交页分类与目录分类不一致，请重新运行目录构建脚本。');
}
if (errors.length) throw new Error(errors.join('\n'));
console.log(`Catalog valid: ${catalog.categories.length} categories, ${urls.size} unique sites, and matching submit options.`);
