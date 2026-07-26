import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const pages = ['index.html', 'about/index.html', 'commit.html'];
const timeoutMs = 12_000;
const concurrency = 6;

function extractLinks(html) {
  const links = new Set();
  for (const match of html.matchAll(/\b(?:href|data-url)=["'](https?:[^"']+)/gi)) {
    links.add(match[1].replace(/&amp;/g, '&'));
  }
  return links;
}

async function check(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'HadisLinkAudit/1.0 (+https://web.008997.xyz/)' }
    });
    if ([405, 501].includes(response.status)) {
      response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'user-agent': 'HadisLinkAudit/1.0 (+https://web.008997.xyz/)' }
      });
    }
    const level = response.ok ? '正常' : ([401, 403, 429].includes(response.status) ? '需人工确认' : '异常');
    return { url, level, status: response.status, destination: response.url };
  } catch (error) {
    return { url, level: '需人工确认', status: error.name === 'AbortError' ? '超时' : '连接失败', destination: '' };
  } finally {
    clearTimeout(timer);
  }
}

const links = new Set();
for (const page of pages) {
  const html = await readFile(resolve(page), 'utf8');
  for (const url of extractLinks(html)) links.add(url);
}

const queue = [...links];
const results = [];
async function worker() {
  while (queue.length) results.push(await check(queue.shift()));
}
await Promise.all(Array.from({ length: concurrency }, worker));
results.sort((a, b) => a.level.localeCompare(b.level) || a.url.localeCompare(b.url));

const report = [
  '# Hadis 外链巡检报告',
  '',
  `生成时间：${new Date().toISOString()}`,
  `检查数量：${results.length}`,
  '',
  '| 状态 | HTTP 状态 | 原链接 | 最终地址 |',
  '| --- | --- | --- | --- |',
  ...results.map((item) => `| ${item.level} | ${item.status} | ${item.url} | ${item.destination || '-'} |`),
  ''
].join('\n');

await mkdir('reports', { recursive: true });
await writeFile('reports/link-audit.md', report, 'utf8');
console.log(`Checked ${results.length} links. Report written to reports/link-audit.md.`);
