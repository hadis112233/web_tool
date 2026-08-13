import { readFile, writeFile } from 'node:fs/promises';

const catalog = JSON.parse(await readFile('data/sites.json', 'utf8'));
const indexPath = 'index.html';
const startMarker = '<!-- SITE_CATALOG_START -->';
const endMarker = '<!-- SITE_CATALOG_END -->';
const commitPath = 'commit.html';
const categoryStartMarker = '<!-- SUBMIT_CATEGORIES_START -->';
const categoryEndMarker = '<!-- SUBMIT_CATEGORIES_END -->';

const escape = (value) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

function renderCard(site) {
  const href = escape(site.url);
  const title = escape(site.name);
  const description = escape(site.description);
  const image = escape(site.image || 'assets/images/logos/default.webp');
  const securityAttributes = site.allowInsecure
    ? ' data-insecure="true" title="此网站仅支持 HTTP 明文连接"'
    : '';
  const securityBadge = site.allowInsecure
    ? '<span class="insecure-badge" aria-label="仅支持 HTTP 明文连接">HTTP</span>'
    : '';
  const featuredAttribute = Number.isInteger(site.featured) ? ` data-featured="${site.featured}"` : '';
  return `<div class="url-card col-6 col-sm-6 col-md-4 col-xl-5a col-xxl-6a"${featuredAttribute}><div class="url-body default"><a href="${href}" target="_blank" rel="noopener noreferrer" class="card no-c mb-4"${securityAttributes}><div class="card-body"><div class="url-content d-flex align-items-center"><div class="url-img mr-2 d-flex align-items-center justify-content-center"><img class="lazy" loading="lazy" decoding="async" width="40" height="40" src="${image}" alt=""></div><div class="url-info flex-fill"><div class="text-sm overflowClip_1"><strong>${title}${securityBadge}</strong></div><p class="overflowClip_1 m-0 text-muted text-xs">${description}</p></div></div></div></a></div></div>`;
}

function renderCategory(category) {
  return `<div class="d-flex flex-fill"${category.id ? ` id="${escape(category.id)}"` : ''}><h2 class="site-category-title text-gray text-lg mb-4"><i class="site-tag iconfont ${escape(category.icon || 'icon-tag')} icon-lg mr-1"></i>${escape(category.name)}</h2></div>\n<div class="row">${category.sites.map(renderCard).join('')}</div>`;
}

const index = await readFile(indexPath, 'utf8');
if (!index.includes(startMarker) || !index.includes(endMarker)) {
  throw new Error('找不到网站目录标记，未写入 index.html。');
}
const block = `${startMarker}\n${catalog.categories.map(renderCategory).join('\n')}\n${endMarker}`;
const output = index.replace(new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`), block);
await writeFile(indexPath, output, 'utf8');

const commit = await readFile(commitPath, 'utf8');
if (!commit.includes(categoryStartMarker) || !commit.includes(categoryEndMarker)) {
  throw new Error('找不到提交分类标记，未写入 commit.html。');
}
const options = [
  ...catalog.categories.map((category) => `<option value="${escape(category.name)}">${escape(category.name)}</option>`),
  '<option value="其他">其他</option>'
].join('');
const categoryBlock = `${categoryStartMarker}${options}${categoryEndMarker}`;
const commitOutput = commit.replace(
  new RegExp(`${categoryStartMarker}[\\s\\S]*?${categoryEndMarker}`),
  categoryBlock
);
await writeFile(commitPath, commitOutput, 'utf8');

console.log(`Built ${catalog.categories.length} categories, ${catalog.categories.reduce((sum, item) => sum + item.sites.length, 0)} cards, and submit options.`);
