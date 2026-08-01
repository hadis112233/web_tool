import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const logoDir = path.join(root, 'assets/images/logos');
const sharePath = path.join(root, 'assets/images/hadis-share.png');
const legacyBackgroundPath = path.join(root, 'assets/images/bg-dna.webp');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const indexPageScript = fs.readFileSync(path.join(root, 'assets/js/index-page.js'), 'utf8');
const serviceWorker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const errors = [];

const referencedLogos = new Set();
for (const match of index.matchAll(/(?:src|data-src)=["']([^"']+)["']/g)) {
  const cleanUrl = match[1].split(/[?#]/)[0].replace(/^\.\//, '');
  let decodedUrl = cleanUrl;
  try { decodedUrl = decodeURI(cleanUrl); } catch {}
  if (decodedUrl.startsWith('assets/images/logos/')) {
    referencedLogos.add(path.posix.basename(decodedUrl));
  }
}

const logoFiles = fs.readdirSync(logoDir, { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name);
const logoSizes = logoFiles.map((name) => ({
  name,
  bytes: fs.statSync(path.join(logoDir, name)).size,
}));
const totalLogoBytes = logoSizes.reduce((total, logo) => total + logo.bytes, 0);
const oversizedLogos = logoSizes.filter((logo) => logo.bytes > 8_000);
const orphanLogos = logoFiles.filter((name) => !referencedLogos.has(name)).sort();
if (orphanLogos.length) {
  errors.push(`存在首页未引用的站点图标：${orphanLogos.join(', ')}`);
}
if (oversizedLogos.length) {
  errors.push(`存在超过 8 KB 的站点图标：${oversizedLogos.map((logo) => `${logo.name} (${logo.bytes} bytes)`).join(', ')}`);
}
if (totalLogoBytes > 280_000) {
  errors.push(`站点图标总体积过大：${totalLogoBytes} bytes，应不超过 280000 bytes。`);
}

if (fs.existsSync(legacyBackgroundPath)) {
  errors.push('旧版 DNA 背景图仍然存在。');
}
if (/bg-dna\.webp|setSearchBackground/.test(index + indexPageScript + serviceWorker)) {
  errors.push('页面脚本或 Service Worker 仍引用旧版 DNA 背景。');
}

if (!fs.existsSync(sharePath)) {
  errors.push('缺少社交分享图片 hadis-share.png。');
} else {
  const share = fs.readFileSync(sharePath);
  const pngSignature = '89504e470d0a1a0a';
  const width = share.length >= 24 ? share.readUInt32BE(16) : 0;
  const height = share.length >= 24 ? share.readUInt32BE(20) : 0;

  if (share.subarray(0, 8).toString('hex') !== pngSignature) {
    errors.push('社交分享图片不是有效的 PNG 文件。');
  }
  if (width !== 1200 || height !== 630) {
    errors.push(`社交分享图片尺寸错误：${width}×${height}，应为 1200×630。`);
  }
  if (share.length > 220_000) {
    errors.push(`社交分享图片体积过大：${share.length} bytes。`);
  }
}

if (errors.length) {
  console.error(`图片资源校验失败（${errors.length} 项）：`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  const shareBytes = fs.statSync(sharePath).size;
  console.log(`Image assets valid: ${logoFiles.length} referenced logos (${totalLogoBytes} bytes), share image ${shareBytes} bytes.`);
}
