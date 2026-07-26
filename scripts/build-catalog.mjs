import { readFile, writeFile } from 'node:fs/promises';

const catalog = JSON.parse(await readFile('data/sites.json', 'utf8'));
const indexPath = 'index.html';
const startMarker = '<!-- SITE_CATALOG_START -->';
const endMarker = '<!-- SITE_CATALOG_END -->';

const escape = (value) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

function renderCard(site) {
  const href = escape(site.url);
  const title = escape(site.name);
  const description = escape(site.description);
  const image = escape(site.image || 'assets/images/logos/default.webp');
  return `                <div class="url-card col-6 col-sm-6 col-md-4 col-xl-5a col-xxl-6a">
                    <div class="url-body default">
                        <a href="${href}" target="_blank" rel="noopener noreferrer" data-id="" data-url="${href}" class="card no-c mb-4" data-toggle="tooltip" data-placement="bottom" data-original-title="${description}">
                            <div class="card-body"><div class="url-content d-flex align-items-center">
                                <div class="url-img mr-2 d-flex align-items-center justify-content-center"><img class="lazy" loading="lazy" decoding="async" width="40" height="40" src="${image}" alt="${title}"></div>
                                <div class="url-info flex-fill"><div class="text-sm overflowClip_1"><strong>${title}</strong></div><p class="overflowClip_1 m-0 text-muted text-xs">${description}</p></div>
                            </div></div>
                        </a>
                        <a href="${href}" class="togo text-center text-muted is-views" data-id="" data-toggle="tooltip" data-placement="right" title="直达" rel="nofollow noopener noreferrer"><i class="iconfont icon-goto"></i></a>
                    </div>
                </div>`;
}

function renderCategory(category) {
  return `            <div class="d-flex flex-fill">
                <h4 class="text-gray text-lg mb-4"><i class="site-tag iconfont ${escape(category.icon || 'icon-tag')} icon-lg mr-1"${category.id ? ` id="${escape(category.id)}"` : ''}></i>${escape(category.name)}</h4>
            </div>
            <div class="row">
${category.sites.map(renderCard).join('\n\n')}
            </div>`;
}

const index = await readFile(indexPath, 'utf8');
if (!index.includes(startMarker) || !index.includes(endMarker)) {
  throw new Error('找不到网站目录标记，未写入 index.html。');
}
const block = `${startMarker}\n\n${catalog.categories.map(renderCategory).join('\n\n')}\n\n${endMarker}`;
const output = index.replace(new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`), block);
await writeFile(indexPath, output, 'utf8');
console.log(`Built ${catalog.categories.length} categories and ${catalog.categories.reduce((sum, item) => sum + item.sites.length, 0)} cards.`);
