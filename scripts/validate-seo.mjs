import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const pages = [
  { file: 'index.html', url: 'https://web.008997.xyz/' },
  { file: 'about/index.html', url: 'https://web.008997.xyz/about/' },
  { file: 'commit.html', url: 'https://web.008997.xyz/commit' },
];
const errors = [];

function attribute(tag, name) {
  return tag?.match(new RegExp(`\\b${name}=["']([^"']+)["']`, 'i'))?.[1] || '';
}

for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page.file), 'utf8');
  if (/<meta\b[^>]*\bname=["']keywords["']/i.test(html)) {
    errors.push(`${page.file} 仍包含 Google 不使用的 keywords 元标签。`);
  }
  if (/<meta\b[^>]*\bhttp-equiv=["']X-UA-Compatible["']/i.test(html)) {
    errors.push(`${page.file} 仍包含仅供已退役 Internet Explorer 使用的兼容模式标签。`);
  }
  const canonicalTag = html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*>/i)?.[0];
  const ogUrlTag = html.match(/<meta\b[^>]*\bproperty=["']og:url["'][^>]*>/i)?.[0];
  const canonical = attribute(canonicalTag, 'href');
  const ogUrl = attribute(ogUrlTag, 'content');

  if (canonical !== page.url) errors.push(`${page.file} canonical 错误：${canonical || '缺失'}`);
  if (ogUrl !== page.url) errors.push(`${page.file} og:url 错误：${ogUrl || '缺失'}`);

  const structuredBlocks = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const structuredUrls = [];
  for (const block of structuredBlocks) {
    try {
      const data = JSON.parse(block[1]);
      if (typeof data.url === 'string') structuredUrls.push(data.url);
    } catch {
      errors.push(`${page.file} 包含无效的 JSON-LD 结构化数据。`);
    }
  }
  if (/"@type"\s*:\s*"SearchAction"/i.test(html)) {
    errors.push(`${page.file} 仍包含 Google 已停止支持的站点搜索框 SearchAction 数据。`);
  }
  if (!structuredUrls.includes(page.url)) {
    errors.push(`${page.file} 结构化数据缺少标准地址：${page.url}`);
  }
}

const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const expectedUrls = pages.map((page) => page.url);
for (const url of expectedUrls) {
  if (!sitemapUrls.includes(url)) errors.push(`sitemap.xml 缺少标准地址：${url}`);
}
for (const url of sitemapUrls) {
  if (!expectedUrls.includes(url)) errors.push(`sitemap.xml 包含非标准或未知地址：${url}`);
}

const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
if (!/^Sitemap:\s*https:\/\/web\.008997\.xyz\/sitemap\.xml\s*$/im.test(robots)) {
  errors.push('robots.txt 未指向正式站点地图。');
}

if (errors.length) {
  console.error(`SEO 地址校验失败（${errors.length} 项）：`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`SEO metadata valid: ${pages.length} pages use current metadata, canonical, Open Graph, JSON-LD, and sitemap.`);
}
