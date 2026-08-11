import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const errors = [];
const securityHeaders = new Map([
  ['X-Content-Type-Options', 'nosniff'],
  ['X-Frame-Options', 'SAMEORIGIN'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ['Permissions-Policy', 'camera=(), microphone=(), geolocation=()'],
  ['Strict-Transport-Security', 'max-age=31536000; includeSubDomains'],
  ['Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; font-src 'self' data:; form-action 'self' mailto:; base-uri 'self'; frame-ancestors 'self'"],
]);
const assetCache = 'public, max-age=86400, stale-while-revalidate=604800';

function parseCloudflareHeaders(source) {
  const rules = new Map();
  let current = '';
  for (const rawLine of source.split(/\r?\n/)) {
    if (!rawLine.trim() || rawLine.trimStart().startsWith('#')) continue;
    if (!/^\s/.test(rawLine)) {
      current = rawLine.trim();
      rules.set(current, new Map());
      continue;
    }
    const match = rawLine.trim().match(/^([^:]+):\s*(.+)$/);
    if (current && match) rules.get(current).set(match[1], match[2]);
  }
  return rules;
}

const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const vercelRules = new Map((vercel.headers || []).map((rule) => [
  rule.source,
  new Map((rule.headers || []).map((header) => [header.key, header.value])),
]));
const cloudflareRules = parseCloudflareHeaders(fs.readFileSync(path.join(root, '_headers'), 'utf8'));
const nginx = fs.readFileSync(path.join(root, 'nginx/web.008997.xyz.conf.example'), 'utf8');
const vercelSecurity = vercelRules.get('/(.*)') || new Map();
const cloudflareSecurity = cloudflareRules.get('/*') || new Map();

for (const [name, value] of securityHeaders) {
  if (vercelSecurity.get(name) !== value) errors.push(`vercel.json 的 ${name} 缺失或不一致。`);
  if (cloudflareSecurity.get(name) !== value) errors.push(`_headers 的 ${name} 缺失或不一致。`);
  if (!nginx.includes(`add_header ${name} "${value}" always;`)) {
    errors.push(`Nginx 示例配置的 ${name} 缺失或不一致。`);
  }
}

if (vercelRules.get('/assets/(.*)')?.get('Cache-Control') !== assetCache) {
  errors.push('vercel.json 的静态资源缓存策略缺失或不一致。');
}
if (cloudflareRules.get('/assets/*')?.get('Cache-Control') !== assetCache) {
  errors.push('_headers 的静态资源缓存策略缺失或不一致。');
}
if (!nginx.includes('return 301 https://$host$request_uri;')) {
  errors.push('Nginx 示例配置缺少 HTTP 到 HTTPS 的永久跳转。');
}
if (!nginx.includes('try_files $uri $uri/ $uri.html =404;')) {
  errors.push('Nginx 示例配置不支持 /commit 等无扩展名标准地址。');
}
if (!nginx.includes('ssl_protocols TLSv1.2 TLSv1.3;')) {
  errors.push('Nginx 示例配置未限制为 TLS 1.2 和 TLS 1.3。');
}
if (!nginx.includes('expires 1d;') || /max-age=2592000|\bimmutable\b/.test(nginx)) {
  errors.push('Nginx 示例配置的静态资源缓存可能长期保留未版本化旧图标。');
}

if (errors.length) {
  console.error(`部署响应头校验失败（${errors.length} 项）：`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Deployment config valid: ${securityHeaders.size} security headers match Cloudflare, Vercel, and Nginx; canonical routes and safe caching are enabled.`);
}
