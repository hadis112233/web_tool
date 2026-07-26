import { readFile } from 'node:fs/promises';

const catalog = JSON.parse(await readFile('data/sites.json', 'utf8'));
const errors = [];
const ids = new Set();
const urls = new Set();
for (const category of catalog.categories || []) {
  if (!category.id || ids.has(category.id)) errors.push(`分类锚点重复或缺失：${category.name}`);
  ids.add(category.id);
  for (const site of category.sites || []) {
    if (!site.name || !site.url || !site.description || !site.image) errors.push(`网站字段不完整：${site.name || category.name}`);
    try { new URL(site.url); } catch { errors.push(`网址无效：${site.name}`); }
    if (urls.has(site.url)) errors.push(`网址重复：${site.url}`);
    urls.add(site.url);
  }
}
if (errors.length) throw new Error(errors.join('\n'));
console.log(`Catalog valid: ${catalog.categories.length} categories, ${urls.size} unique sites.`);
