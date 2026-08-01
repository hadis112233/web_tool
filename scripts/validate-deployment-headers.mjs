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
const vercelSecurity = vercelRules.get('/(.*)') || new Map();
const cloudflareSecurity = cloudflareRules.get('/*') || new Map();

for (const [name, value] of securityHeaders) {
  if (vercelSecurity.get(name) !== value) errors.push(`vercel.json 的 ${name} 缺失或不一致。`);
  if (cloudflareSecurity.get(name) !== value) errors.push(`_headers 的 ${name} 缺失或不一致。`);
}

if (vercelRules.get('/assets/(.*)')?.get('Cache-Control') !== assetCache) {
  errors.push('vercel.json 的静态资源缓存策略缺失或不一致。');
}
if (cloudflareRules.get('/assets/*')?.get('Cache-Control') !== assetCache) {
  errors.push('_headers 的静态资源缓存策略缺失或不一致。');
}

if (errors.length) {
  console.error(`部署响应头校验失败（${errors.length} 项）：`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Deployment headers valid: ${securityHeaders.size} security headers and asset caching match Cloudflare and Vercel.`);
}
