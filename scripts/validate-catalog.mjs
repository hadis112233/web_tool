import { readFile } from 'node:fs/promises';

const catalog = JSON.parse(await readFile('data/sites.json', 'utf8'));
const commit = await readFile('commit.html', 'utf8');
const index = await readFile('index.html', 'utf8');
const enhancements = await readFile('assets/js/site-enhancements.js', 'utf8');
const errors = [];
const ids = new Set();
const urls = new Set();
const approvedInsecureUrls = new Set([
  'http://101.43.88.87:40005/',
  'http://www.sccnn.com/',
  'http://ziticq.com/',
  'http://www.tretars.com/ppt-templates'
]);
const renderedInsecureUrls = new Set();
const featuredSites = [];
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
    let parsedUrl;
    try { parsedUrl = new URL(site.url); } catch { errors.push(`网址无效：${site.name}`); }
    if (parsedUrl?.protocol === 'http:') {
      if (site.allowInsecure !== true || !approvedInsecureUrls.has(site.url)) {
        errors.push(`HTTP 网址未经过明确审核：${site.name}（${site.url}）`);
      }
      renderedInsecureUrls.add(site.url);
    } else if (site.allowInsecure === true) {
      errors.push(`HTTPS 网址不应标记 allowInsecure：${site.name}`);
    }
    if (urls.has(site.url)) errors.push(`网址重复：${site.url}`);
    if (retiredUrls.has(site.url)) errors.push(`仍在使用已停用或过时的网址：${site.name}（${site.url}）`);
    urls.add(site.url);
    if (site.featured !== undefined) featuredSites.push(site);
  }
}
for (const url of approvedInsecureUrls) {
  if (!renderedInsecureUrls.has(url)) errors.push(`HTTP 白名单包含已移除网址，请同步清理：${url}`);
}
const insecureCardCount = (index.match(/\bdata-insecure="true"/g) || []).length;
const insecureBadgeCount = (index.match(/\bclass="insecure-badge"/g) || []).length;
if (insecureCardCount !== approvedInsecureUrls.size || insecureBadgeCount !== approvedInsecureUrls.size) {
  errors.push('首页 HTTP 卡片标识与审核白名单不一致，请重新运行目录构建脚本。');
}
const featuredRanks = featuredSites.map((site) => site.featured).sort((left, right) => left - right);
if (JSON.stringify(featuredRanks) !== JSON.stringify([1, 2, 3, 4, 5, 6])) {
  errors.push('精选资源顺序必须是唯一且连续的 1 到 6。');
}
const renderedFeaturedRanks = [...index.matchAll(/\bdata-featured="(\d+)"/g)]
  .map((match) => Number(match[1])).sort((left, right) => left - right);
if (JSON.stringify(renderedFeaturedRanks) !== JSON.stringify(featuredRanks)) {
  errors.push('首页精选资源标记与数据源不一致，请重新运行目录构建脚本。');
}
if (!enhancements.includes('return card.dataset.featured;') || enhancements.includes('title.textContent.trim()')) {
  errors.push('精选资源仍依赖可见标题文字匹配，徽标可能导致卡片丢失。');
}
const submitOptions = [...commit.matchAll(/<option value="([^"]+)">/g)]
  .map((match) => match[1])
  .filter(Boolean);
const expectedOptions = [...catalog.categories.map((category) => category.name), '其他'];
if (JSON.stringify(submitOptions) !== JSON.stringify(expectedOptions)) {
  errors.push('提交页分类与目录分类不一致，请重新运行目录构建脚本。');
}
if (errors.length) throw new Error(errors.join('\n'));
console.log(`Catalog valid: ${catalog.categories.length} categories, ${urls.size} unique sites, ${featuredSites.length} featured resources, and matching submit options.`);
